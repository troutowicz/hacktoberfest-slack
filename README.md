# hacktoberfest-slack
> A Slack command providing Hacktoberfest information

Borrowing the idea from [jenkoian/hacktoberfest-checker](https://github.com/jenkoian/hacktoberfest-checker), this project aims to provide similar functionality as a Slack command.

## Use as a Slack integration

* https://slack.com/apps/build/custom-integration
* Click `Slash Commands`
* Use `/hacktoberfest` for command
* Use `https://hacktoberfest.timrz.me` for URL
* Use `hacktoberfest` for post as username
* Save integration

## Development

### Config

Use `config.example.js` as a template.

* [Create GitHub API token](https://github.com/blog/1509-personal-api-tokens)

### Run

```sh
npm install
npm start
```
