// =============================================================================
// GENIO CORE — Moteur de provisioning vertical
// Crée un tenant + membership + tenant_config selon le vertical détecté au signup
// =============================================================================

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { VERTICAL_PACKS } from '@/types'
import type { MemberRole, Vertical } from '@/types'

// Mapping signup profile → vertical GeniO
const PROFILE_TO_VERTICAL: Record<string, Vertical> = {
  // RH / Entreprise
  'rh':                        'rh',
  'office':                    'rh',
  'tech-startup':              'rh',
  'associations':              'rh',
  // Santé / Care
  'sante-medico-social':       'care',
  'services-a-la-personne':    'field',
  // BTP / Artisan
  'industrie-btp':             'craft',
  'commerce-distribution':     'craft',
  // Restauration
  'hotellerie-restauration':   'craft',
  // Transport
  'transport-logistique':      'craft',
}

export type ProvisionTenantInput = {
  userId: string
  email: string
  tenantName: string
  profile?: string
  vertical?: Vertical
}

export async function provisionTenant({
  userId,
  email,
  tenantName,
  profile,
  vertical: explicitVertical,
}: ProvisionTenantInput): Promise<{ tenantId: string }> {
  const supabase = createAdminClient()

  // Résolution du vertical
  const vertical: Vertical =
    explicitVertical ??
    (profile ? (PROFILE_TO_VERTICAL[profile] ?? 'rh') : 'rh')

  const pack = VERTICAL_PACKS[vertical] ?? VERTICAL_PACKS['rh']!

  // Récupérer le plan gratuit de départ
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('id')
    .eq('slug', 'free')
    .single()

  if (planError ?? !plan) {
    throw new Error(`Plan introuvable: ${planError?.message}`)
  }

  // Générer un slug unique depuis le nom du tenant
  const slug = await generateUniqueSlug(tenantName, supabase)

  // Créer le tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      plan_id:       plan.id,
      name:          tenantName,
      slug,
      vertical,
      sub_status:    'trialing',
      trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    })
    .select('id')
    .single()

  if (tenantError ?? !tenant) {
    throw new Error(`Erreur création tenant: ${tenantError?.message}`)
  }

  const tenantId = tenant.id

  // Créer le membership owner
  const { error: membershipError } = await supabase
    .from('memberships')
    .insert({
      tenant_id:  tenantId,
      user_id:    userId,
      role:       'owner' satisfies MemberRole,
      is_active:  true,
      joined_at:  new Date().toISOString(),
    })

  if (membershipError) {
    throw new Error(`Erreur création membership: ${membershipError.message}`)
  }

  // Créer la config métier depuis le pack vertical
  const { error: configError } = await supabase
    .from('tenant_config')
    .insert({
      tenant_id:            tenantId,
      module_acquisition:   pack.default_modules.acquisition,
      module_crm:           pack.default_modules.crm,
      module_onboarding:    pack.default_modules.onboarding,
      module_documents:     pack.default_modules.documents,
      module_regulations:   pack.default_modules.regulations,
      module_pdf:           pack.default_modules.pdf,
      module_voice:         pack.default_modules.voice,
      module_itinerary:     pack.default_modules.itinerary,
      module_billing:       pack.default_modules.billing,
      vocab:                pack.vocab,
      notif_expiry_days:    [30, 14, 7],
      notif_email:          true,
    })

  if (configError) {
    throw new Error(`Erreur création config: ${configError.message}`)
  }

  return { tenantId }
}

// ---------------------------------------------------------------------------
// Lecture du contexte utilisateur courant
// ---------------------------------------------------------------------------

export async function getCurrentTenantContext() {
  const sessionClient = await createClient()
  const { data: userData, error: userError } = await sessionClient.auth.getUser()

  if (userError ?? !userData.user) {
    throw new Error('Non authentifié')
  }

  const supabase = createAdminClient()
  const userId = userData.user.id

  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select('tenant_id, role, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (membershipError ?? !membership) {
    throw new Error('Aucun workspace associé à ce compte')
  }

  return {
    userId,
    tenantId:  membership.tenant_id,
    role:      membership.role as MemberRole,
  }
}

export async function requireRole(allowedRoles: MemberRole[]) {
  const ctx = await getCurrentTenantContext()

  if (!allowedRoles.includes(ctx.role)) {
    throw new Error(`Rôle insuffisant — requis : ${allowedRoles.join(', ')}`)
  }

  return ctx
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function generateUniqueSlug(
  name: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<string> {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)

  let slug = base
  let i = 1

  while (true) {
    const { data } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!data) return slug

    slug = `${base}-${i}`
    i++
  }
}
