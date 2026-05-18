create type public.onboarding_step_status as enum ('todo', 'done');

create table public.employee_onboarding_steps (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  description text not null,
  position int not null,
  status public.onboarding_step_status not null default 'todo',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.employee_onboarding_steps enable row level security;

create policy "members can read onboarding steps"
  on public.employee_onboarding_steps for select
  using (workspace_id in (select workspace_id from public.profiles where id = auth.uid()));

create policy "hr can manage onboarding steps"
  on public.employee_onboarding_steps for all
  using (
    workspace_id in (
      select workspace_id from public.profiles
      where id = auth.uid() and role in ('admin', 'hr', 'manager')
    )
  );

insert into public.employee_onboarding_steps (
  employee_id,
  workspace_id,
  title,
  description,
  position,
  status,
  completed_at
)
select
  employees.id,
  employees.workspace_id,
  steps.title,
  steps.description,
  steps.position,
  case when steps.position = 1 then 'done'::public.onboarding_step_status else 'todo'::public.onboarding_step_status end,
  case when steps.position = 1 then now() else null end
from public.employees
cross join (
  values
    (1, 'Candidature validée', 'Confirmer le passage du candidat vers le parcours d''arrivée.'),
    (2, 'Mail candidat envoyé', 'Envoyer le message de bienvenue avec les prochaines informations.'),
    (3, 'RDV téléphonique manager planifié', 'Caler le premier échange entre le manager et le futur collaborateur.'),
    (4, 'Documents d''arrivée demandés', 'Demander les documents nécessaires au dossier RH.'),
    (5, 'Jour d''arrivée préparé', 'Vérifier le planning, le matériel et les accès de base.')
) as steps(position, title, description);
