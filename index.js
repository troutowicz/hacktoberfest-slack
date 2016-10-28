import bodyParser from 'body-parser';
import express from 'express';
import moment from 'moment';
import Github from 'github';

import config from './config.js';
import getIssues from './lib/getIssues.js';
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
      text: 'To check user progress, use `/hacktoberfest user <username> [verbose]`.\nTo discover open issues, use `/hacktoberfest issues`.',
      mrkdwn_in: [ 'text' ]
    }]
  }
}

app.get('/', (req, res) => {
  return res.send();
});

app.post('/', urlencodedParser, (req, res) => {
  const [ action, username, verbose ] = req.body.text.split(' ');

  switch (action) {
    case 'help':
      return res.send(help());
      break;
    case 'user':
      if (!username) {
        return res.send(help());
      }

      getPullRequests(github, username, (err, octoberPrs) => {
        if (err) {
          return res.send('Hmm, spell that username right?');
        }

        const message = {};

        if (octoberPrs.length >= PR_GOAL) {
          message.text = `${username} reached the ${PR_GOAL} PR goal on ${moment(octoberPrs[0].createdAt).format('MMMM Do')}! (<${octoberPrs[0].url}|PR>)`;
        } else {
          message.text = `${username} has created ${octoberPrs.length} PRs. ${PR_GOAL - octoberPrs.length} more to go!`;
        }
        message.response_type = 'in_channel';
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

        return res.send(message);
      });
      break;
    case 'issues':
      getIssues(github, (err, octoberOpenIssues, totalIssues) => {
        if (err) {
          return res.send('Hmm, something went wrong.');
        }

        const message = {
          text: `Here are ${octoberOpenIssues.length} out of ${totalIssues} open issues!`,
        };

        message.attachments = octoberOpenIssues.map((issue) => {
          return {
            color: '#36a64f',
            author_name: issue.repoUrl.split('https://github.com/')[1],
            author_link: issue.repoUrl,
            title: issue.title,
            title_link: issue.url,
          };
        });

        return res.send(message);
      });
      break;
    default:
      return res.send(help());
  }
});

app.listen(config.port, () => {
  github.authenticate({
    type: 'oauth',
    token: config.githubApiKey,
  });

  console.info(`Listening on port ${config.port}`);
});

