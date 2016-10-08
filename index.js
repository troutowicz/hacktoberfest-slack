import Botkit from 'botkit';
import Github from 'github';

import config from './config.js';

const controller = Botkit.slackbot({
  debug: false,
  stats_optout: true,
});

const github = new Github({
  version: '3.0.0',
  debug: false,
  protocol: 'https',
  host: 'api.github.com',
  timeout: 5000,
  headers: {
    'user-agent': 'Hacktoberfest Checker'
  }
});

function getPullRequests (username, cb) {
  const options = {
    q: '-label:invalid+created:2016-09-30T00:00:00-12:00..2016-10-31T23:59:59-12:00+type:pr+is:public+author:' + username
  };
  const octoberPrs = [];
  let userImage;

  github.search.issues(options, (err, res) => {
    if (err) {
      return cb(err);
    }

    Object.keys(res.items).forEach((key) => {
      const event = res.items[key];
      const repo = event.pull_request.html_url.substring(0, event.pull_request.html_url.search('/pull'));

      if (!userImage) {
        userImage = event.user.avatar_url;
      }

      const hacktoberFestLabels = Object.keys(event.labels).filter((key) => {
        return event.labels[key].name.toLowerCase() === 'hacktoberfest';
      });

      octoberPrs.push({
        repo_name: repo,
        title: event.title,
        url: event.html_url,
        state: event.state,
        hasHacktoberFestLabel: hacktoberFestLabels.length > 0
      });
    });

    cb(null, octoberPrs, userImage);
  });
}

controller.on('direct_mention', (bot, message) => {
  const username = message.text;

  getPullRequests(username, (err, octoberPrs, userImage) => {
    if (err) {
      return bot.reply(message, 'Hmm, spell that username right?');
    }

    const attachments = octoberPrs.map((pr) => {
      return {
        color: "#36a64f",
        title: pr.title,
        title_link: pr.url,
        fields: [
          {
            title: 'State',
            value: pr.state,
            short: true,
          },
          {
            title: 'Hacktoberfest Label',
            value: pr.hasHacktoberFestLabel.toString(),
            short: true,
          }
        ],
      };
    });

    bot.reply(message, {
      text: username + ' has created ' + octoberPrs.length + '/4 pull requests.',
      attachments: attachments,
    });
  });
});

// Start bot

github.authenticate({
  type: 'oauth',
  token: config.githubApiKey,
});

controller.spawn({
  token: config.slackBotApiKey,
}).startRTM();
