# Agent - Desktop

Descrption

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `npm install` to install all the dependancy packages

Create a branch out of existing branch `develop` to make start developement preferably `feature/<feature-name> or dev/<your-name>`.

```
# To checkout develop
git checkout b develop

# To create new branch
For feature branch: git checkout -b feature/<your-feature>
or
For developer branch: git checkout -b dev/<your-name>
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

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
