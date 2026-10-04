/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'core-not-to-modules-or-components',
      comment: 'core is infrastructure and must not know about modules or components',
      severity: 'error',
      from: { path: '^src/core/' },
      to: { path: '^src/(modules|components)/' },
    },
    {
      name: 'ui-not-to-modules',
      comment: 'UI primitives must not depend on domain modules',
      severity: 'error',
      from: { path: '^src/components/ui/' },
      to: { path: '^src/modules/' },
    },
    {
      name: 'no-cross-module-repository',
      comment: 'A module may only reach another module through its public service surface',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: {
        path: '^src/modules/([^/]+)/repository',
        pathNot: '^src/modules/$1/repository',
      },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
