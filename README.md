# Agent - Desktop

Descrption

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `npm install` to install all the dependancy packages.

Create a branch out of existing branch `develop` to start developement, preferably `<type>/<scope>`.

If you already have the develop branch please make sure you pull the latest before you work on any item.

### Type

Must be one of the following:

-   **build**: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
-   **ci**: Changes to our CI configuration files and scripts (example scopes: Circle, BrowserStack, SauceLabs)
-   **docs**: Documentation only changes
-   **feat**: A new feature
-   **fix**: A bug fix
-   **perf**: A code change that improves performance
-   **refactor**: A code change that neither fixes a bug nor adds a feature
-   **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
-   **test**: Adding missing tests or correcting existing tests

### Scope

The scope should be the name of JIRA-ID for the particular type.

```
feat/PB-900
fix/PB-812
```

To create a collection widget Run `ng generate @schematics/angular:component --name=tw-<widget-name> --project=agent-desktop --path=src/app/modules/t-widgets/tw-collections --style=scss --selector=tw-<widget-name> --viewEncapsulation=None`.

Or install NX Console extension in code to generate the component under @schematics/angular:component.

All the the collection widgets created to be added under `modules/t-widgets/utils/widget-library/tw-library` with the widget type defined in config.

Please refer to `tw-sample` component under `modules/t-widgets/tw-collections/` to create a widget.

TMAC SDK can accessed using `SDKClient` variable which is a property under `@tmac/sdk` package. All the event names and interfaces are also available.

Once the developement is completed please commit to your branch and raise a merge-request to the `develop` branch.

```
# To add and commit with message:
git commit -am "<your-commit-message>"

or [preferably below]

# If you want to add more change logs then
git add
git commit

# press i
# Add first line as commit message heading
# Changeslogs from seconds line
# press "shift + :wq"

git push origin "<your-branch>"

# If you are pushing for the first time then:
git push --set-upstream origin <your-branch>
```

Please do not make any changes or commit to `master` or `develop` branch.

## Patch release

To do a patch release for Agent Desktop, please follow the following steps:

Clone new Agent Desktop from the GIT because your working repo will have the latest code and latest of node_module. Older release may need older version of packages and if the patch work is done in working folder, you will have to delete and install the node_module again to get the latest packages. So, it is suggest to work in new folder for the patch releases.

```bash
git clone https://git.tetherfi.com/tetherfi_product/products/tmac/ui/agent-desktop.git
```

Every releases are added as a tag in GIT, so pull the required version's tag and create a new branch for that version like `patch/<version>-patch.<patch-no>`. For example,

```bash
git checkout -b patch/x.x.x.x-patch.y
```

Run `npm install` to install all the dependancy packages.

TMAC SDK may be different for older release, so make sure you replace the latest version of TMAC SDK in `node_module` with the patch version or the previous to the patch version. To get particular version of TMAC SDK, go to SVN path [svn://repo.tetherfi.com/InterLink/ProductReleases/Versions/TMAC/SDK](svn://repo.tetherfi.com/InterLink/ProductReleases/Versions/TMAC/SDK) and go to the particular version and copy all file and replace in `node_module/@tmac/sdk` (make sure you delete and add). This is needed only if the patch version is using TMAC SDK version older than the latest.

Make necessary changes needed for the patch and commit to the branch. Change the version in `package.json` and build the project. Once the build is completed, copy `dist/agent-desktop` to a new folder in Agent Desktop's version release path with the folder name `x.x.x.x-patch.y`. For the patch release we do not update the `Latest` folder unless it is an update for the latest release.

Once the release process is completed, create a new tag from this branch in remote and delete this particular branch.

## Build

Run `npm run build:prod` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
