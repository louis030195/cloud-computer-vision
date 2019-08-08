# Data flows, ops etc estimation
## USE CASE
get on main page, upload a pic, go back on main page see the result
with batch optimized architecture data / operations estimations:
### storage
- 2mb img
- 1 op put img
- x size tfrecord
- 1 op put tfrecord
- x size put batch prediction result
- 1 op put batch prediction
### datastore
- x rows class mapping
- 2 row frame (put, then update when prediction are ready)
- x rows prediction
- x rows objects
- 1 op put class mapping
- 1 op put frame
- 1 op prediction
- 1 op put objects
### function
- 1 op tfrecord caller
- 1 op batch predictor
### pubsub
- 1 op call tfrecord builder
### appengine TODO: take into account the config of each app engine (x instances ...)
- 2 op front render / (first time then see result)
- 1 op front render /upload
- 1 op back call /frames  \# and video ?
- 1 op back call POST /frames
- 1 op call tfrecord builder api
### aiplatform
- 1 op batch call

## USE CASE
get on main page, upload a video, go back on main page see the result
with batch optimized architecture data / operations estimations:
### storage
- 20mb vid
- 1 op put vid
- 20mb / frames size ??
- x op put frames
- x size tfrecord
- 1 op put tfrecord
- x size put batch prediction result
- 1 op put batch prediction
### datastore
- x rows class mapping
- 2 * x frames row vid (put, then update when prediction are ready)
- 2 vid row
- x rows prediction
- x rows objects
- 1 op put class mapping
- 1 op put frame
- x frames op prediction
- x frames op put objects
### function
- 1 op tfrecord caller (depend if we can store all these frames in 1 tfrecord or not)
- 1 op batch predictor (same)
### pubsub
- 1 op call tfrecord builder
### appengine TODO: take into account the config of each app engine (x instances ...)
- 2 op front render / (first time then see result)
- 1 op front render /upload
- 1 op back call /videos  \# and frames ?
- 1 op back call POST /videos
- 1 op call tfrecord builder api
### aiplatform
- 1 op batch call