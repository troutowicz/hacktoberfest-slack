export default function getPullRequests (github, username, cb) {
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
