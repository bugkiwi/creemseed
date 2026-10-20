export const project = {
  repository: 'https://github.com/bugkiwi/creemseed',
  template: 'https://github.com/bugkiwi/creemseed/generate',
  documentation: 'https://github.com/bugkiwi/creemseed/tree/main/docs',
};

const parameters = new URLSearchParams({
  'repository-url': project.repository,
  'project-name': 'creemseed',
  'repository-name': 'creemseed',
  env: 'DEMO_MODE,BILLING_ENABLED',
  envDefaults: JSON.stringify({ DEMO_MODE: 'true', BILLING_ENABLED: 'false' }),
  envDescription:
    'Public demo only. Accounts, billing, and webhooks are disabled. Follow the deployment guide to enable your own application.',
  envLink: `${project.repository}/blob/main/docs/deployment.md`,
});
export const deployUrl = `https://vercel.com/new/clone?${parameters}`;
