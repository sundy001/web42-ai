import type { AuthRequest } from "@/domains/auth/types";
import { createThread } from "@/domains/threads";
import { BadRequestError } from "@/utils/errors";
import type {
  CreateProjectFromPromptResponse,
  ProjectResponse,
} from "@web42-ai/types";
import * as projectRepository from "./project.repository";

/**
 * Mock AI model call to generate project name from prompt
 * In a real implementation, this would call an AI service
 */
async function generateProjectNameFromPrompt(prompt: string): Promise<string> {
  // Mock implementation - generate a name based on the prompt
  const words = prompt
    .toLowerCase()
    .split(" ")
    .filter((word) => word.length > 3);
  const relevantWords = words.slice(0, 2);

  if (relevantWords.length === 0) {
    return "New Project";
  }

  // Capitalize first letter of each word
  const projectName = relevantWords
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return projectName || "New Project";
}

/**
 * Create a new project from a user prompt
 */
export async function createProjectByPrompt(
  prompt: string,
  authRequest: AuthRequest,
): Promise<CreateProjectFromPromptResponse> {
  if (!authRequest.user) {
    throw new BadRequestError("User authentication required");
  }

  // Generate project name from prompt
  const projectName = await generateProjectNameFromPrompt(prompt);

  // Create project in database
  const project = await projectRepository.createProject({
    userId: authRequest.user.id,
    name: projectName,
  });

  // Create initial thread with the prompt as the first message
  const threadMessages = await createThread(project._id.toString(), prompt);

  // Format response
  const projectResponse: ProjectResponse = {
    id: project._id.toString(),
    name: project.name,
  };

  // TODO: may clean up later, only need project object.
  return {
    project: projectResponse,
    thread: threadMessages,
  };
}
