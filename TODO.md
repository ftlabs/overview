# TODO

+ check that <= or >= is included again in the query string builder
+ validation on url params?
+ needs rate limiting/spreading for large numbers of requests
+ request caching


## For thought

+ Spark line
	- deviation calculation? which/waht has deviated from the norm
		- large deviations should include
			- spikes
			- constant high percentiles
			- steady/consistent growth 