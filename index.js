import bodyParser from 'body-parser';
import express from 'express';
import moment from 'moment';
import morgan from 'morgan';
import Github from 'github';

import config from './config.js';
import getPullRequests from './lib/getPullRequests.js';

const PR_GOAL = 4;

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

function help () {
  return {
    text: 'How to use `/hacktoberfest`',
    attachments:[{
      text: 'To check progress, use `/hacktoberfest progress <username> [verbose]`.\nTo discover open issues, use `/hacktoberfest suggest`.',
      mrkdwn_in: [ 'text' ]
    }]
  }
}

app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.send();
});

app.post('/', urlencodedParser, (req, res) => {
  if (req.body.token !== config.slackToken) {
    res.status(401);
  }

  const [ action, username, verbose ] = req.body.text.split(' ');

  switch (action) {
    case 'help':
      res.send(help());
      break;
    case 'progress':
      getPullRequests(github, username, (err, octoberPrs, userImage) => {
        if (err) {
          return res.send('Hmm, spell that username right?');
        }

        const message = {};

        if (octoberPrs.length >= PR_GOAL) {
          message.text = `${username} reached the ${PR_GOAL} PR goal on ${moment(octoberPrs[3].createdAt).format('MMMM Do')}! (<${octoberPrs[3].url}|PR>)`;
        } else {
          message.text = `${username} has created ${octoberPrs.length} PRs. ${PR_GOAL - octoberPrs.length} more to go!`;
        }

        if (verbose) {
          message.attachments = octoberPrs.map((pr) => {
            return {
              color: '#36a64f',
              author_name: pr.repoUrl.split('https://github.com/')[1],
              author_link: pr.repoUrl,
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
                  value: pr.hasHacktoberfestLabel.toString(),
                  short: true,
                }
              ],
            };
          });
        }

        res.send(message);
      });
      break;
    default:
      res.send(help());
  }
});

app.listen(config.port, () => {
  github.authenticate({
    type: 'oauth',
    token: config.githubApiKey,
  });

  console.info(`Listening on port ${config.port}`);
});

