import { App } from "@octokit/app";
import { Octokit } from "octokit";

/**
 * Service to interact with the GitHub App.
 * Handles JWT authentication and installation-specific Octokits.
 */
export class GitHubAppService {
  private _app: App | null = null;

  private get app(): App {
    if (this._app) return this._app;

    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!appId || !privateKey) {
      // In production/runtime, these are required.
      // During build, we don't want to throw at the module level.
      throw new Error("GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY is missing in env");
    }

    this._app = new App({
      appId,
      privateKey,
    });

    return this._app;
  }

  /**
   * Gets an Octokit instance authenticated as a specific installation.
   */
  async getInstallationOctokit(installationId: number): Promise<Octokit> {
    return (await this.app.getInstallationOctokit(installationId)) as unknown as Octokit;
  }

  /**
   * Verifies the webhook signature.
   */
  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error("GITHUB_WEBHOOK_SECRET is missing in env");
    }
    return await this.app.webhooks.verify(payload, signature);
  }
}

export const githubAppService = new GitHubAppService();
