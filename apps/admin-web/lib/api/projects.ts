import type {
  CreateProjectFromPromptRequest,
  CreateProjectFromPromptResponse,
} from "@web42-ai/types";
import { API_ENDPOINTS, authFetch } from "./config";

/**
 * Create a new project from a user prompt
 * @param prompt - The user prompt to generate a project from
 * @returns The created project and initial thread messages
 */
export const createProjectFromPrompt = async (
  prompt: string,
): Promise<CreateProjectFromPromptResponse> => {
  const request: CreateProjectFromPromptRequest = { prompt };

  const { data } = await authFetch<CreateProjectFromPromptResponse>(
    API_ENDPOINTS.projects.fromPrompt,
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );

  return data;
};
