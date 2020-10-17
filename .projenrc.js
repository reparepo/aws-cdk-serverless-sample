const {
  AwsCdkTypeScriptApp,
  GithubWorkflow,
} = require('projen');

const AUTOMATION_TOKEN = 'AUTOMATION_GITHUB_TOKEN';

const project = new AwsCdkTypeScriptApp({
  cdkVersion: "1.63.0",
  name: "aws-cdk-serverless-sample",
  authorName: "Pahud Hsieh",
  authorEmail: "pahudnet@gmail.com",
  repository: "https://github.com/pahud/aws-cdk-serverless-sample.git",
  dependabot: false,
  antitamper: false,
  cdkDependencies: [
    "@aws-cdk/core",
    "@aws-cdk/aws-apigatewayv2",
    "@aws-cdk/aws-codepipeline",
    "@aws-cdk/aws-codepipeline-actions",
    "@aws-cdk/aws-lambda",
    "@aws-cdk/pipelines",
  ]
});

// create a custom projen and yarn upgrade workflow
const workflow = new GithubWorkflow(project, 'ProjenYarnUpgrade');

workflow.on({
  schedule: [{
    cron: '0 6 * * *'
  }], // 6am every day
  workflow_dispatch: {}, // allow manual triggering
});

workflow.addJobs({
  upgrade: {
    'runs-on': 'ubuntu-latest',
    'steps': [
      { uses: 'actions/checkout@v2' },
      { 
        uses: 'actions/setup-node@v1',
        with: {
          'node-version': '10.17.0',
        }
      },
      { run: `yarn install` },
      { run: `yarn projen` },
      { run: `yarn upgrade` },
      { run: `yarn projen:upgrade` },
      // submit a PR
      {
        name: 'Create Pull Request',
        uses: 'peter-evans/create-pull-request@v3',
        with: {
          'token': '${{ secrets.' + AUTOMATION_TOKEN + ' }}',
          'commit-message': 'chore: upgrade projen',
          'branch': 'auto/projen-upgrade',
          'title': 'chore: upgrade projen and yarn',
          'body': 'This PR upgrades projen and yarn upgrade to the latest version',
          'labels': 'auto-merge',
        }
      },
    ],
  },
});

const common_exclude = ['cdk.out', 'cdk.context.json', '.venv', 'images', 'yarn-error.log'];
project.npmignore.exclude(...common_exclude);
project.gitignore.exclude(...common_exclude);

project.synth();
