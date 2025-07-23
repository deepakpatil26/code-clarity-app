import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Octokit } from '@octokit/rest';

export async function GET(
  request: Request,
  { params }: { params: { owner: string; repo: string; prNumber: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { owner, repo, prNumber } = params;
    const prNum = parseInt(prNumber, 10);

    if (isNaN(prNum)) {
      return NextResponse.json(
        { error: 'Invalid PR number' },
        { status: 400 }
      );
    }

    const token = session.user.accessToken;
    const octokit = new Octokit({ auth: token });
    const { data: pr } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNum,
    });

    return NextResponse.json(pr);
  } catch (error: any) {
    console.error('Error fetching PR details:', error);
    
    // Handle GitHub API errors
    if (error.status) {
      if (error.status === 404) {
        return NextResponse.json(
          { error: 'Repository or pull request not found' },
          { status: 404 }
        );
      } else if (error.status === 401 || error.status === 403) {
        return NextResponse.json(
          { 
            error: 'GitHub authentication failed',
            details: error.message || 'Please check your GitHub permissions and try again.'
          },
          { status: error.status }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch PR details',
        details: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
