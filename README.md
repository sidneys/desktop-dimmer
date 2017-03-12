# Desktop Dimmer [![Beta](https://img.shields.io/badge/status-alpha-blue.svg?style=flat)]() [![travis](https://img.shields.io/travis/sidneys/desktop-dimmer.svg?style=flat)](https://travis-ci.org/sidneys/desktop-dimmer) [![appveyor](https://ci.appveyor.com/api/projects/status/oc57pq7hfslqg3ru?svg=true)](https://ci.appveyor.com/project/sidneys/desktop-dimmer) [![npm](https://img.shields.io/npm/v/desktop-dimmer.svg?style=flat)](https://npmjs.com/package/desktop-dimmer) [![dependencies](https://img.shields.io/david/sidneys/desktop-dimmer.svg?style=flat-square)](https://npmjs.com/package/desktop-dimmer) [![devDependencies](https://img.shields.io/david/dev/sidneys/desktop-dimmer.svg?style=flat-square)](https://npmjs.com/package/desktop-dimmer)

<p align="center">
  <img height="250px" src="https://raw.githubusercontent.com/sidneys/desktop-dimmer/master/resources/graphics/icon.png"/><br><br>
  <b>Enable darker-than-dark dimming for internal and external screens.</b><br>
  Available for macOS, Windows and Linux (Beta).
</p>


------

![macOS](https://raw.githubusercontent.com/sidneys/desktop-dimmer/master/resources/screenshots/screenshot-macos.png)
![Windows 10](https://raw.githubusercontent.com/sidneys/desktop-dimmer/master/resources/screenshots/screenshot-win32.png)

------

> **Cross-Platform**

Tested on macOS Sierra, Windows 10 Anniversary. Beta support for Ubuntu 16.10. 

> **Lean**

Small resource footprint, minimal User Interface.

>  **Unobstrusive**

Settings are persisted and restored per-Display without any configuration.

> **Smart**

Heading out? Disconnecting and reconnecting external displays are handled seamlessly.

>  **Open Source**

GitHub-based workflow, MIT licensed.


## Contents

1. [Installation](#installation)
2. [Developers](#development)
3. [Continuous Integration](#continuous-integration)
4. [Up Next](#up-next)
5. [Contact](#contact)
6. [Author](#author)


## <a name="installation"/></a> Installation

### Standard Installation

Download the latest version of Desktop Dimmer on the [Releases](https://github.com/sidneys/desktop-dimmer/releases) page.

### Installation as Commandline Tool

```bash
npm install --global desktop-dimmer		# Installs the node CLI module
desktop-dimmer							# Runs it
```


## <a name="developers"/></a> Developers

### Sources

Clone the repo and install dependencies.

```shell
git clone https://github.com/sidneys/desktop-dimmer.git desktop-dimmer
cd desktop-dimmer
npm install
```

### Scripts

#### npm run **start**

Run the app with integrated Electron.

```bash
npm run start
npm run start:dev 					# with Debugging Tools
npm run start:livereload 			# with Debugging Tools and Livereload
```

#### npm run **localsetup**

Install the app in the System app folder and start it.

```bash
npm run localsetup
npm run localsetup:rebuild			# Build before installation
npm run localsetup:rebuild:dev 		# Build before installation, use Developer Tools
```

#### npm run **build**

Build the app and create installers (see [requirements](#build-requirements)).

```bash
npm run build					# build all available platforms
npm run build macos windows		# build specific platforms (macos/linux/windows)
```

### Build Requirements

* Building for Windows requires [`wine`](https://winehq.org) and [`mono`](https://nsis.sourceforge.net/Docs/Chapter3.htm) (on macOS, Linux)
* Building for Linux requires  [`fakeroot`](https://wiki.debian.org/FakeRoot) and [`dpkg `](https://wiki.ubuntuusers.de/dpkg/) (on macOS, Windows)
* Only macOS can build for other platforms.

#### macOS Build Setup

Install [Homebrew](https://brew.sh), then run:

```bash
brew install wine mono fakeroot dpkg
```

#### Linux  Build Setup

```bash
sudo apt-get install wine mono fakeroot dpkg
```


## <a name="continuous-integration"/></a> Continuous Integration

> Turnkey **build-in-the-cloud** for Windows 10, macOS and Linux.

The process is managed by a custom layer of node scripts and Electron-optimized configuration templates.
Completed Installation packages are deployed to [GitHub Releases](https://github.com/sidneys/desktop-dimmer/releases). Builds for all platforms and architectures take about 5 minutes.
Backed by the open-source-friendly guys at [Travis](https://travis-ci.org/) and [AppVeyor](https://ci.appveyor.com/) and running [electron-packager](https://github.com/electron-userland/electron-packager) under the hood.

### Setup

1.  [Fork](https://github.com/sidneys/desktop-dimmer/fork) the repo
2.  Generate your GitHub [Personal Access Token](https://github.com/settings/tokens) using "repo" as scope. Copy it to the clipboard.
3.  **macOS + Linux**
     1. Sign in to [Travis](https://travis-ci.org/) using GitHub.
     2. Open your [Travis Profile](https://travis-ci.org/profile), click "Sync Account" and wait for the process to complete.
     3. Find this repository in the list, enable it and click "⚙" to open its settings.
     4. Create a new Environment Variable named **GITHUB_TOKEN**. Paste your Token from step 2 as *value*. 
4.  **Windows**
     1. Sign in to [AppVeyor](https://ci.appveyor.com/) using GitHub.
     2. Click on ["New Project"](https://ci.appveyor.com/projects/new), select "GitHub", look up this repo in the list and click "Add".
     3. After import navigate to the *Settings* > *Environment* subsection
     4. Select "Add Variable", insert **GITHUB_TOKEN** for *name*, paste your Token as *value*. Save.

### Triggering Builds

1. Add a new Tag to start the build process:

   ```shell
   git tag -a v1.0.1
   git push --tags
   ```
   The builds are started in parallel and added to the "Releases" page of the GitHub repo (in draft mode).

2. Use the editing feature to publish the new app version.

3. There is no step 3


## <a name="up-next"/></a> Up Next ![img](https://img.shields.io/badge/proposals-welcome-green.svg?style=flat)

- [ ] <span style="color: cyan;">Colored Shades</span>
- [ ] In-App Updates (Squirrel)
- [ ] Signed binaries
- [ ] E2E Testing ([Spectron](https://github.com/electron/spectron))


## <a name="contribute"/></a> Contact ![Contributions Wanted](https://img.shields.io/badge/contributions-wanted-red.svg?style=flat)

* [Gitter](https://gitter.im/sidneys/desktop-dimmer) Developer Chat
* [Issues](https://github.com/sidneys/desktop-dimmer/issues) File, track and discuss features and issues
* [Wiki](https://github.com/sidneys/desktop-dimmer/wiki) Read or contribute to the project Wiki


## <a name="author"/></a> Author

[sidneys](https://sidneys.github.io) 2016
