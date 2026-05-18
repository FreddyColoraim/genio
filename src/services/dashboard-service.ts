import type { Employee, OnboardingStatus } from "@/types/employee";
import type { Metric } from "@/components/dashboard/metric-card";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type EmployeeRow = {
  id: string;
  full_name: string;
  email: string;
  title: string;
  department: string;
  manager_name: string | null;
  start_date: string;
  status: "not_started" | "in_progress" | "waiting" | "complete";
  progress: number;
};

type EmployeeDocumentRow = {
  employee_id: string;
  status: "pending" | "review" | "signed";
};

type ProfileRow = {
  workspace_id: string | null;
};

export type DashboardData = {
  employees: Employee[];
  metrics: Metric[];
};

const statusMap: Record<EmployeeRow["status"], OnboardingStatus> = {
  not_started: "Not started",
  in_progress: "In progress",
  waiting: "Waiting",
  complete: "Complete"
};

const frenchDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric"
});

export async function getDashboardData(): Promise<DashboardData> {
  const sessionClient = await createClient();
  const { data: userData } = await sessionClient.auth.getUser();

  if (!userData.user) {
    return buildDashboardData([], []);
  }

  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("workspace_id")
    .eq("id", userData.user.id)
    .single();

  if (profileError) {
    throw new Error(`Unable to load dashboard profile: ${profileError.message}`);
  }

  const typedProfile = profile as ProfileRow;

  if (!typedProfile.workspace_id) {
    return buildDashboardData([], []);
  }

  const { data: employeeRows, error: employeesError } = await adminClient
    .from("employees")
    .select(
      "id, full_name, email, title, department, manager_name, start_date, status, progress"
    )
    .eq("workspace_id", typedProfile.workspace_id)
    .order("start_date", { ascending: true });

  if (employeesError) {
    throw new Error(`Unable to load dashboard employees: ${employeesError.message}`);
  }

  const employees = (employeeRows ?? []) as EmployeeRow[];
  const employeeIds = employees.map((employee) => employee.id);

  if (employeeIds.length === 0) {
    return buildDashboardData([], []);
  }

  const { data: documentRows, error: documentsError } = await adminClient
    .from("employee_documents")
    .select("employee_id, status")
    .eq("workspace_id", typedProfile.workspace_id)
    .in("employee_id", employeeIds);

  if (documentsError) {
    throw new Error(`Unable to load dashboard documents: ${documentsError.message}`);
  }

  return buildDashboardData(employees, (documentRows ?? []) as EmployeeDocumentRow[]);
}

function buildDashboardData(
  employeeRows: EmployeeRow[],
  documentRows: EmployeeDocumentRow[]
): DashboardData {
  const pendingDocumentsByEmployee = documentRows.reduce<Record<string, number>>(
    (counts, document) => {
      if (document.status !== "signed") {
        counts[document.employee_id] = (counts[document.employee_id] ?? 0) + 1;
      }

      return counts;
    },
    {}
  );

  const employees = employeeRows.map<Employee>((employee) => ({
    id: employee.id,
    name: employee.full_name,
    email: employee.email,
    role: employee.title,
    accessRole: "employee",
    department: employee.department,
    manager: employee.manager_name ?? "Non assigné",
    startDate: frenchDateFormatter.format(new Date(`${employee.start_date}T00:00:00`)),
    progress: employee.progress,
    status: statusMap[employee.status],
    pendingDocuments: pendingDocumentsByEmployee[employee.id] ?? 0
  }));

  return {
    employees,
    metrics: buildMetrics(employeeRows, documentRows)
  };
}

function buildMetrics(employeeRows: EmployeeRow[], documentRows: EmployeeDocumentRow[]): Metric[] {
  const totalEmployees = employeeRows.length;
  const activeEmployees = employeeRows.filter((employee) => employee.status !== "complete");
  const completeEmployees = employeeRows.filter((employee) => employee.status === "complete");
  const averageProgress = totalEmployees
    ? Math.round(
        employeeRows.reduce((total, employee) => total + employee.progress, 0) / totalEmployees
      )
    : 0;
  const documentsToHandle = documentRows.filter((document) => document.status !== "signed");
  const receivedDocuments = documentRows.filter((document) => document.status === "review");
  const startsThisMonth = employeeRows.filter((employee) => isInCurrentMonth(employee.start_date));

  return [
    {
      label: "Onboardings actifs",
      value: String(activeEmployees.length),
      detail: `${completeEmployees.length} parcours terminés`,
      tone: "blue"
    },
    {
      label: "Progression moyenne",
      value: `${averageProgress}%`,
      detail: `${totalEmployees} collaborateur${totalEmployees > 1 ? "s suivis" : " suivi"}`,
      tone: "sage"
    },
    {
      label: "Documents en attente",
      value: String(documentsToHandle.length),
      detail: `${receivedDocuments.length} reçus à valider`,
      tone: "lavender"
    },
    {
      label: "Arrivées ce mois-ci",
      value: String(startsThisMonth.length),
      detail: "Basé sur la date d'arrivée",
      tone: "navy"
    }
  ];
}

function isInCurrentMonth(date: string) {
  const now = new Date();
  const startDate = new Date(`${date}T00:00:00`);

  return (
    startDate.getFullYear() === now.getFullYear() && startDate.getMonth() === now.getMonth()
  );
}
