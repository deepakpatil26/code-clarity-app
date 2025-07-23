/**
 * @fileOverview Zod schemas for GitHub-related data structures.
 */
import { z } from "genkit";

export const RepositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  fullName: z.string(),
  isPrivate: z.boolean(),
  url: z.string(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stars: z.number(),
  forks: z.number(),
  updatedAt: z.string().nullable(),
  owner: z.string(),
});
export type Repository = z.infer<typeof RepositorySchema>;

export const ListRepositoriesInputSchema = z.object({
  authToken: z.string().describe("The GitHub OAuth token for authentication."),
});
export type ListRepositoriesInput = z.infer<typeof ListRepositoriesInputSchema>;

export const ListRepositoriesOutputSchema = z.object({
  repositories: z
    .array(RepositorySchema)
    .describe("A list of the user's repositories."),
});
export type ListRepositoriesOutput = z.infer<
  typeof ListRepositoriesOutputSchema
>;

export const PullRequestSchema = z.object({
  id: z.number(),
  number: z.number(),
  title: z.string(),
  url: z.string(),
  state: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: z.object({
    login: z.string(),
    avatarUrl: z.string(),
  }),
});
export type PullRequest = z.infer<typeof PullRequestSchema>;

export const ListPullRequestsInputSchema = z.object({
  authToken: z.string().describe("The GitHub OAuth token for authentication."),
  owner: z.string().describe("The owner of the repository."),
  repo: z.string().describe("The name of the repository."),
});
export type ListPullRequestsInput = z.infer<typeof ListPullRequestsInputSchema>;

export const ListPullRequestsOutputSchema = z.object({
  pullRequests: z.array(PullRequestSchema),
});
export type ListPullRequestsOutput = z.infer<
  typeof ListPullRequestsOutputSchema
>;

export const GetPullRequestDiffInputSchema = z.object({
  authToken: z.string().describe("The GitHub OAuth token for authentication."),
  owner: z.string().describe("The owner of the repository."),
  repo: z.string().describe("The name of the repository."),
  pullNumber: z.number().describe("The number of the pull request."),
});
export type GetPullRequestDiffInput = z.infer<
  typeof GetPullRequestDiffInputSchema
>;

export const GetPullRequestDiffOutputSchema = z.object({
  diff: z.string().describe("The diff content of the pull request."),
});
export type GetPullRequestDiffOutput = z.infer<
  typeof GetPullRequestDiffOutputSchema
>;
