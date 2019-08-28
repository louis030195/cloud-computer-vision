# Development
It is highly recommended to just use GitPod for development, there is less setup to do but you can also do locally

export the environment variables from above, in addition, those too:

    export PORT=8080
    export SECRET=keyboardcat

## Local development
- [Install NodeJS](https://www.google.com/search?ei=D3Q4XZGcM8OHjLsPs--n8AM&q=install+nodejs)

```
git clone https://github.com/louis030195/vision-client.git
cd vision-client
npm install
```

# TODO
- Script that configure all the repo + gcp automatically
- Split back / front
- Reset / remake new predictions (new model ...)
- Time / price estimator / simulator (before launching the task and after also)
- Stuff with dates, count, stats ...
- More vizualisation / stats / graphics
- LOGS LOGS LOGS
- Datastore callbacks (E.g delete frame => delete its predictions+objects see [doc](https://cloud.google.com/appengine/docs/standard/java/datastore/callbacks#top_of_page))
- ...