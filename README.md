# Code repository for yourcommunity.space @ GovHack 2017

This is the project repository for datastrikesback.yourcommunity.space

Government grants to community organisations are an underappreciated but very important glue that helps hold our local communities together. Supporting everything from the CFS, the local swimming pool or country town parklands, find out where the money is spent. This tool can be used by planners to see if any area or group is inadvertently biased to more funding, for further investigation.

To run the app, go to http://yourcommunity.space

Hosting is by https://yourcommunityspace.github.io/datastrikesback/

Hackerspace page: https://2017.hackerspace.govhack.org/project/yourcommunityspace

Video: https://youtu.be/R9RTq_oGBd0

The code is not in this git branch, check out the gh-pages branch instead.


# Original data sources

Data in assets/ is either source from or has been modified from the following.

* Australian states from the 2006 Census. Data from http://www.abs.gov.au/ausstats/abs@.nsf/DetailsPage/1259.0.30.0022006?OpenDocument via QGIS to simplify geometry
* Grants SA funded projects 2016-2017. Dataset URL https://data.sa.gov.au/data/dataset/a572374e-ebdd-4513-a224-f7e79f126431
* SA Government Regions (geojson) Dataset URL https://data.sa.gov.au/data/dataset/south-australian-government-regions/resource/0b972188-7d62-40b1-a614-f53c07cec81a
* SA Government Regions (csv) Dataset https://data.sa.gov.au/data/dataset/4d92b947-7b09-4486-bd7a-e4b2ae15a62c/resource/d1a80b5d-5840-4b9b-a61b-5034fb1042de/download/sagrconcordancetables.csv
* Road Crash Data. Dataset URL https://data.sa.gov.au/data/dataset/road-crashes-in-sa
* List of South Australian education and preschool sites with latitude and longitude, updated as at June 2017. Dataset URL https://data.sa.gov.au/data/dataset/child-development-sites
* ABS Census table builder (for population data) http://www.abs.gov.au/websitedbs/D3310114.nsf/Home/2016%20TableBuilder
* Federal grants data via http://regional.gov.au/local/assistance/fags-state-summaries-sa.aspx
The app is a proof of concept! Other data sets have been identified and partially transformed for use with the app, as noted in the project page.

Mapping Between data sets:
"Government Regions" csv file contains a series of mapping between region names.
From this we mapped post codes to regions  and local government areas to postcodes.

List of government schools calcuated by interseccting the geojson map to lat/lon coordinates in csv file.
