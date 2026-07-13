/**
 * Run API service — streams a workspace pipeline run as newline-delimited JSON.
 */

import type { RunEvent } from '@/types/runs'
import { apiStream } from '@/lib/api-client'

function runPath(projectId: string, workspaceId: string): string {
  return `/api/v1/projects/${projectId}/workspaces/${workspaceId}/run`
}

// POST the pipeline and yield each streamed run event. The run executes live during the request;
// nothing is polled and nothing is persisted.
export async function* streamRunApi(projectId: string, workspaceId: string, pipeline: object): AsyncGenerator<RunEvent> {
  for await (const event of apiStream(runPath(projectId, workspaceId), { pipeline }))
    yield event as RunEvent
}
