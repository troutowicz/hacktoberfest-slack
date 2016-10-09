import bodyParser from 'body-parser';
import express from 'express';
import morgan from 'morgan';
import Github from 'github';

import config from './config.js';
import getPullRequests from './lib/getPullRequests.js';

const app = express();
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const github = new Github({
  version: '3.0.0',
  debug: false,
  protocol: 'https',
  host: 'api.github.com',
  timeout: 5000,
  headers: {
    'user-agent': 'Hacktoberfest Checker'
  },
});

app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.send();
});

app.post('/', urlencodedParser, (req, res) => {
  if (req.body.token !== config.slackToken) {
    res.status(401);
  }

  const username = req.body.text;

  getPullRequests(github, username, (err, octoberPrs, userImage) => {
    if (err) {
      return res.send('Hmm, spell that username right?');
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

    res.send({
      text: username + ' has created ' + octoberPrs.length + '/4 pull requests.',
      attachments: attachments,
    });
  });
});

app.listen(config.port, () => {
  github.authenticate({
    type: 'oauth',
    token: config.githubApiKey,
  });

  console.info(`Listening on port ${config.port}`);
});

