import shuffle from 'lodash.shuffle';

export default function getIssues(github, cb){
  const options = {
    q : 'type:issue+label:hacktoberfest+state:open',
    sort : 'created',
    order : 'desc',
  };
  const octoberOpenIssues = [];

  github.search.issues(options, (err, res) => {
    if (err) {
      return cb(err);
    }

    const totalIssues = res.total_count;

    shuffle(res.items).slice(0, 10).forEach((issue) => {
      octoberOpenIssues.push({
        repoUrl: issue.html_url.substring(0, issue.html_url.search('/issues')),
        title: issue.title,
        url: issue.html_url,
        labels: issue.labels,
        created: issue.created_at,
      });
    });

    cb(null, octoberOpenIssues, totalIssues);
  });
}
