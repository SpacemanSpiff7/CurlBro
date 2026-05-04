import { onRequestOptions, onRequestPost } from '../functions/api/emails';

type EmailRouteContext = Parameters<typeof onRequestPost>[0];

interface AssetsBinding {
  fetch: (request: Request) => Promise<Response>;
}

type WorkerEnv = EmailRouteContext['env'] & {
  ASSETS: AssetsBinding;
};

interface WorkerExecutionContext {
  waitUntil: (promise: Promise<unknown>) => void;
}

const EMAILS_PATH = '/api/emails';
const ALLOW_HEADER = 'POST, OPTIONS';

function isEmailsRoute(pathname: string) {
  return pathname === EMAILS_PATH || pathname === `${EMAILS_PATH}/`;
}

export async function handleRequest(
  request: Request,
  env: WorkerEnv,
  ctx: WorkerExecutionContext,
) {
  const { pathname } = new URL(request.url);

  if (isEmailsRoute(pathname)) {
    const routeContext: EmailRouteContext = {
      request,
      env,
      waitUntil: (promise) => ctx.waitUntil(promise),
    };

    if (request.method === 'POST') {
      return onRequestPost(routeContext);
    }

    if (request.method === 'OPTIONS') {
      return onRequestOptions(routeContext);
    }

    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        allow: ALLOW_HEADER,
      },
    });
  }

  return env.ASSETS.fetch(request);
}

export default {
  fetch: handleRequest,
};
