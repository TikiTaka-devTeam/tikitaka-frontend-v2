import { apiClient } from "../../../lib/api/client.js";

export async function getDashboardTimetable(year, semester, config = {}) {
  const response = await apiClient.get("/dashboard/timetable", {
    ...config,
    params: {
      ...config.params,
      year,
      semester,
    },
  });

  return response.data;
}

export async function getDashboardAssignments(config = {}) {
  const response = await apiClient.get("/dashboard/assignments", config);

  return response.data;
}
