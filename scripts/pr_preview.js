// @ts-check

/** @param {import('@actions/github-script').AsyncFunctionArguments} _ */
export function afterDeploy({ core, github, context }) {
    /**
     * @param {string} pr
     * @param {string} ref
     */
    return async (pr, ref) => {
        core.info(`Creating deployment event in PR #${pr} for '${ref}'…`);
        const deployment = await github.rest.repos.createDeployment({
            auto_merge: false,
            owner: context.repo.owner,
            repo: context.repo.repo,
            ref: `pull/${pr}/head`,
            environment: `pr-preview-${pr}`,
            transient_environment: true,
            description: `Preview deployment for Pull Request #${pr}`,
            required_contexts: [],
        });

        core.info('Marking deployment as complete…');
        await github.rest.repos.createDeploymentStatus({
            state: 'success',
            environment_url: `https://pr-${pr}--ideditor-preview.netlify.app`,
            owner: context.repo.owner,
            repo: context.repo.repo,
            deployment_id: /** @type {{ id: number }} */ (deployment.data).id,
        });

        core.info('Fetching all artifacts…');
        const artifacts = await github.rest.actions.listWorkflowRunArtifacts({
            owner: context.repo.owner,
            repo: context.repo.repo,
            run_id: context.payload.workflow_run.id,
        });

        for (const artifact of artifacts.data.artifacts) {
            if (artifact.name === 'dist' || artifact.name === 'pr_metadata') {
                core.info('Cleaning up artifact…');
                await github.rest.actions.deleteArtifact({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    artifact_id: artifact.id
                });
            }
        }
        core.info('Done!');
    };
};
