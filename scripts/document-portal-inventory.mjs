import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const escape = (value) =>
  String(value).replaceAll('|', '\\|').replaceAll('\n', ' ').replaceAll('\r', '').replace(/\s+/g, ' ').trim();
const routeSource = ts.createSourceFile(
  'routes.ts',
  fs.readFileSync('domains/portal/routes.ts', 'utf8'),
  ts.ScriptTarget.Latest,
  true,
);
const routes = [];
function walkRoutes(node) {
  if (
    ts.isCallExpression(node) &&
    node.expression.getText(routeSource) === 'entries' &&
    node.arguments.length === 4
  ) {
    const [prefix, permission, group, entries] = node.arguments;
    if (ts.isArrayLiteralExpression(entries))
      for (const entry of entries.elements)
        if (ts.isArrayLiteralExpression(entry))
          routes.push({
            route: prefix.text + entry.elements[0].text,
            title: entry.elements[1].text,
            permission: permission.text,
            group: group.text,
          });
  }
  ts.forEachChild(node, walkRoutes);
}
walkRoutes(routeSource);
fs.writeFileSync(
  'docs/PORTAL_ROUTE_INVENTORY.md',
  `# Prompt 2 portal routes\n\nGenerated from the explicit route registry. Dynamic record routes also implement missing-record states. Client permissions are UX boundaries; backend adapters must enforce the same scope.\n\n| Route | Page | Group | Required permission |\n| --- | --- | --- | --- |\n${routes.map((r) => `| ${r.route} | ${r.title} | ${r.group} | ${r.permission} |`).join('\n')}\n\nAdditional integration routes: /dashboard redirects to the role home; /demo exposes explicitly fictional role fixtures only while config.demo is enabled.\n`,
);
const domainMetadata = {
  goals: [
    '/app, /app/goals/*, /app/history, /app/achievements',
    'Member',
    'member.self; own goal',
    'GoalService',
    'member-goals.spec.ts; goal-service.test.ts; goal-model.test.ts',
  ],
  learning: [
    '/app/learning/*, /app/my-learning',
    'Member',
    'member.self; entitlement for paid content',
    'LearningService',
    'learning-purchase.spec.ts; learning-payments.test.ts',
  ],
  payments: [
    '/app/credits/*, /app/payments',
    'Member',
    'member.self; own payment',
    'PaymentService',
    'learning-purchase.spec.ts; learning-payments.test.ts',
  ],
  account: [
    '/app/profile, /app/settings/*, /app/notifications, /app/help, /app/support; guardian account routes',
    'Active account',
    'self scope',
    'AccountService',
    'portal-acceptance.spec.ts route coverage',
  ],
  administration: [
    '/admin/* (see PORTAL_ROUTE_INVENTORY)',
    'Scoped staff',
    'Collection and command grants in schemas.ts',
    'AdminService / AnalyticsService',
    'portal-roles.spec.ts; admin-service.test.ts; portal-acceptance.spec.ts',
  ],
  guardian: [
    '/guardian/*; public invitation route',
    'Guardian / invitation holder',
    'guardian.linked or valid invitation; scoped projection',
    'GuardianPortalService / GuardianService',
    'portal-roles.spec.ts; mentorship-guardian.test.ts; journeys.spec.ts',
  ],
  mentorship: [
    '/mentor/*, /app/mentor/*, /app/messages; public application',
    'Mentor / member / applicant',
    'mentor.assigned, member.self, or public application',
    'MentorshipPortalService / MentorService',
    'portal-roles.spec.ts; mentorship-guardian.test.ts; mentor.spec.ts',
  ],
  portal: [
    'All role workspaces; /demo',
    'Active role / explicit demo visitor',
    'Route registry grants',
    'Composed domain adapters; DemoWorkspaceService',
    'portal-acceptance.spec.ts; portal-permissions.test.ts; learning-purchase.spec.ts',
  ],
  authentication: [
    '/login, /register, /verify-email, /verify-phone, /forgot-password, /reset-password, /dashboard, /account-status',
    'Visitor / account',
    'Account status and expiry',
    'AuthService / VerificationService',
    'journeys.spec.ts; foundation.test.ts; states.spec.ts',
  ],
  onboarding: [
    '/onboarding',
    'Verified account',
    'Eligibility and independent guardian-consent gates',
    'AuthService / onboarding contract',
    'journeys.spec.ts; states.spec.ts',
  ],
  marketing: [
    'Public routes (see ROUTE_INVENTORY)',
    'Visitor',
    'Public',
    'Public config / SupportService / device preferences',
    'journeys.spec.ts; states.spec.ts',
  ],
  shared: [
    'Reusable control, inherited from each call site below',
    'Inherited',
    'Inherited from owning route',
    'Owning component adapter',
    'foundation.test.ts; role journeys; portal-acceptance.spec.ts',
  ],
};
function files(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? files(path.join(directory, entry.name))
        : entry.name.endsWith('.tsx')
          ? [path.join(directory, entry.name)]
          : [],
    );
}
const tags = new Set([
  'Button',
  'IconButton',
  'ActionLink',
  'Link',
  'Field',
  'Select',
  'Textarea',
  'Check',
  'Password',
  'PhoneInput',
  'DatePicker',
  'FileUpload',
  'Modal',
  'Mutation',
  'Menu',
  'Tabs',
  'SearchPalette',
  'Pagination',
  'Switch',
  'RadioGroup',
  'Combobox',
  'Confirmation',
  'UserMenu',
  'button',
  'input',
  'select',
  'textarea',
  'a',
  'summary',
]);
const rows = [];
for (const file of files('domains')) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const domain = file.split(path.sep)[1];
  const meta = domainMetadata[domain];
  function visit(node) {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      tags.has(node.tagName.getText(source))
    ) {
      const tag = node.tagName.getText(source);
      const attrs = Object.fromEntries(
        node.attributes.properties
          .filter(ts.isJsxAttribute)
          .map((attr) => [attr.name.getText(source), attr.initializer?.getText(source) || 'true']),
      );
      let label = attrs['aria-label'] || attrs.label || attrs.title;
      if (!label && ts.isJsxElement(node.parent))
        label = node.parent.children
          .map((child) =>
            ts.isJsxText(child) ? child.text : ts.isJsxExpression(child) ? child.getText(source) : '',
          )
          .join(' ')
          .trim();
      label ||= attrs.name || `${tag} template; labels supplied by the call site`;
      const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      const navigation = ['Link', 'ActionLink', 'a'].includes(tag);
      rows.push([
        meta[0],
        meta[1],
        label,
        `${tag}: ${file.replaceAll('\\', '/')}:${line}`,
        meta[2],
        navigation
          ? `Navigate to ${attrs.href || 'configured destination'}`
          : [
                'Field',
                'Select',
                'Textarea',
                'Check',
                'input',
                'select',
                'textarea',
                'Password',
                'PhoneInput',
                'DatePicker',
                'FileUpload',
              ].includes(tag)
            ? 'Edit the labelled value; validate on submit'
            : `Perform ${label}; implementation at the linked component`,
        attrs.confirmation ||
          (tag === 'Confirmation' ? 'Yes' : 'No additional confirmation unless owning dialog states it'),
        navigation
          ? 'Destination or scoped missing-record state'
          : 'Updated visible state / saved adapter result / dialog feedback',
        navigation
          ? 'Not-found or permission state'
          : 'Validation error or adapter error notice; failed mutation leaves state unchanged',
        attrs.loading || attrs.disabled || 'Hydration gating; owning form controls pending state',
        'Owning view renders its documented empty state; controls requiring a record are hidden',
        meta[3],
        meta[4],
      ]);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
fs.writeFileSync(
  'docs/INTERACTION_INVENTORY.md',
  `# Interaction inventory\n\nGenerated by scripts/document-portal-inventory.mjs from every interactive JSX control declaration and call site in domains/. Shared controls and dynamic repeated controls are included as templates; their exact labels, routes and domain transition choices come from the route registry, mapped arrays and administrative schemas. Source locations identify each implementation. Native field options, repeated rows, tabs and schema commands inherit their owning template's behavior.\n\nThe test column distinguishes component/domain assertions from route smoke coverage; it does not claim a dedicated assertion for every field option. Backend endpoint families and invariants are in API_CONTRACT.md.\n\n${rows.length} control declarations/call sites catalogued across ${routes.length} portal route patterns.\n\n| Route | User role | Control label | Component | Required permission | Action | Confirmation required | Success result | Failure result | Loading state | Empty state | Backend dependency | Test covering it |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n${rows.map((row) => `| ${row.map(escape).join(' | ')} |`).join('\n')}\n`,
);
console.log(`Documented ${routes.length} routes and ${rows.length} interactive declarations.`);
