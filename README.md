# microplatform (working title)

> on-demand static publishing platform.

## Introduction

Extending `microplatform` is a great way to get your own web publishing platform. It lets you customized the boilerplate projects and dev server while giving you seamless deployment to the the Surge CDN. `microplatform` provides you with your own CLI that published to your domain, and sends event notifications to a webhook of your choice and/or a slack channel. When using microplatform anyone in the public will be able to publish to an unclaimed subdomain on your platform domian just as they currently can do with surge.sh.

---

## Why?

1. Focus - Web publishing is far too broad of a topic for just one tool. The best dev server, tools, and starter project, is very much dependant on the task at hand. `microplatform` makes it really easy to develop focused tools with mature starting projects so no

2. Consistency - The CLI is written for you which means every microplatform CLI behaves the exact same way. Imagine experimenting with someones React project and initializing a new project, starting the dev server and deploying to the web all take the exact same muscle memory regardless of starter project, library, and dev server it uses under the hood.

3. Creativity - Experimenting with new libraries or development setups is now fast and easy. `microplatform` brings the fun back to experimentation.

---

## Getting Started

The best way to understand `microplatform` is to see it in action. To start create a project with `microplatform` as the only dependency. Next all we need to do is have the following executable. For our demo we will save this file as `superfun` and change it to an executable via `chmod +x superfun`.

    #!/usr/local/env node

    require("microplatform")({
      name: "Super Fun Example",
      cmd: "superfun"
    }).exec()

After saving the file as `superfun` and making it executable via `chmod +x superfun` we can then execute the program to get our very own front-end development CLI. Lets begin by running `superfun help`


    superfun platoform - powered by surge.sh
    Dev server & web publishing to https://surge.sh

    Usage:
      superfun <source>             Starts dev server on <source> directory
      superfun <source> <domain>    Publishes <source> directory to the web at <domain>
      superfun <source> <output>    Compiles <source> into <output>

    Global Commands:
      superfun list                 List all projects
      superfun whoami               Show authenticated user
      superfun login                Authenticate and begin session
      superfun logout               Terminate session
      superfun help                 This help message

    Project Commands:
      superfun encrypt <domain>     Requests <domain> verified SSL cert
      superfun teardown <domain>    Removes <domain> from the web

    Examples:
      superfun .                    Serves current dir on port 9966
      superfun . example.com        Publishes current dir to 'example.com'
      superfun . www                Compiles current dir to 'www' directory

    please visit surge.sh for more information


As you can see it doesn't take long for things to take form. Let go ahead and use `superfun` to spin up a local dev server.
    
    ./superfun myproject

Thats it! The project was automatically created and the web server is started! Now lets deploy our project.


    ./superfun myproject http://example.com
    
We are now deployed to the superfun platform which publishes to the surge CDN! as the DNS resolves to the surge servers your project will be available.


## What you will need.

  - a domain name such as `example.com`
  - a wildcard SSL certificate for `*.example.com`.
  - a bank account we can deposit funds into.
  - a great dev server and/or boilerplate project.


## What `microplatform` gives you.

  - A Global CDN enabled web publishing platform on your wildcard domain.
  - CLI published to your npm package.
  - Developer Portal hosted at your domain.
  - A CDN with servers in London, Amsterdam, Toronto, & San Francisco
  - Slack Messages with deployment activity
  - Web-hooks so you can extend your platform with backend services.


## What do our customers get when they use your  platform?

  - atomic deploys to global CDN with instant cache invalidation
  - zero-click automatic SSL provisioning via [LetsEncrypt.org]
  - the ability to add custom CNAME
  - clean URLS & intelligent redirects
  - collaboration and continuous delivery support
  - optional basicAuth password protection

## Examples 

  - harp [harp.sh](https://harp.sh) | [git](https://github.com/sintaxi/harp) | [@HarpPlatform](https://github.com/sintaxi/harp)
  - pwa [pwa.sh](https://pwa.sh) | [git](https://github.com/sintaxi/pwa) | [@pwa](https://twitter.com/twa)
