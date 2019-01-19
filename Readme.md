# Reality Space Readme

This is work in progress...

code-reality framework enables building networked extended reality (XR) experiences with A-Frame.

reality-space servers provide a shared space to store and transmit scene data between code-reality clients.

## Usage

# Testing

## Default cluster (for testing)

### Test users

#### Admin

Issuer: test-issuer
ID: test-admin
Name: Test Admin

Id Token with 100 years life time: 

eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0ZXN0LWlzc3VlciIsImlkIjoidGVzdC1hZG1pbiIsImp0aSI6IjhlYzg5ODA5LTM1ZjYtNGM4ZS04NWJjLWM3NTNjMDZjODk3OSIsIm5hbWUiOiJUZXN0IEFkbWluIiwiZXhwIjo0Njk3OTM4ODUzLCJpYXQiOjE1NDQzMzg4NTN9.EZUj65lAwbNE9iUeXZLNWHlRq23OK5iA8Vul51abuejHDuc6IhuIZCswsUIdPxHGkOsvy6FSm2su5ePpIs1xO1gwQ_u-Nc_Po2BNBqwqIs-sDn9qNVD13Nd5W7_SzxeEWIm7pQft6YP9uvbVV8d-8Nbz8U8KYA5DPLZGodsCQotRL1aBZPbQdc6QB9-rMr2YqpXPQGxAQjjArnl97QPRTig8UxfA9zQWecdNYRXsxtfNFlAnM76uPjN00er4omCxGrWG8vhAAiIQDchwQ7IndRnTyhjybNyWLS2siONFXQ7azfcPa17cM-s_mRfzw4nGZnhEpbYGz1VfVylFC4ivyg

#### Modifier

Issuer: test-issuer
ID: test-modifier
Name: Test Modifier

Id Token with 100 years life time: 

eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0ZXN0LWlzc3VlciIsImlkIjoidGVzdC1tb2RpZmllciIsImp0aSI6IjcwMTQ2MzdjLWMzYTItNGI3NC04YmExLTZiZDMxN2JhZGE0NSIsIm5hbWUiOiJUZXN0IE1vZGlmaWVyIiwiZXhwIjo0Njk3OTM4OTkzLCJpYXQiOjE1NDQzMzg5OTN9.PgjRUGEWCL4OEk8C-zMcZIeBpPM_ky-dDeX_IPAs_C7qR38-fEPzXLFz90IyYxxSLY4-Imwr88Ir65b1cA_eMx6B_8PGAhJ__V4uppBtSOfonlZ402f47kSrUkLZ--IrbDQhM-O1F0cWNtrXTEQXPepsmzMPtclL993RVlJTmyXk-yjbiSLTzp4CA2O3DsLUSXeD1dO58j1rPkMfhLez1zjs7CeWUdzBuzHav0t-hAfWMZTIDywm2UZphAqu724WGbeL4eLP--QBimnyqn9J266u34BmtMSID7VZUWSzWAMteBQVNrOfFZrqS_NkA1jTbmdPO-VkfPmOlGJlCoFN1w

#### User

Issuer: test-issuer
ID: test-user
Name: Test User

Id Token with 100 years life time: 

eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0ZXN0LWlzc3VlciIsImlkIjoidGVzdC11c2VyIiwianRpIjoiYjAxMmFmYjgtNTVlOS00Y2QyLWE4OTctYjk0YmI2NmZlMWJmIiwibmFtZSI6IlRlc3QgVXNlciIsImV4cCI6NDY5NzkzOTA5OCwiaWF0IjoxNTQ0MzM5MDk4fQ.bSah4e0TON77zeuVTrZAAwVz-L4G9YZYjlUsXs7nfB4LjfR7CrWHSj1blNUH9jbPCBjDb06BAigMOiiDuN0Uqh-q7m68NgMh2devGYTaeo2eN8onkehkk0OMd4i72MFtETBwt1kkBdVrs5miVfgu4iDJ2j4XICSHR_iT-_Gl92WYOmpMCxQaW3AqLtW9zchtScjSSkSYpXOSWohssNBqOGNKtw4rVtZpJ8SZLFBZJwyRJbcLdjwtmuAz6PVK90X3E4kdDtDkzh6i3Zw81VOmQ-pN1TR0VUnOqd99HntYpaj0m-xgwoQfEsFTTqZ7tflMGD3cpVCQ0Ekv39rWVWc7XA

#### Viewer

Issuer: test-issuer
ID: test-viewer
Name: Test Viewer

Id Token with 100 years life time: 

eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0ZXN0LWlzc3VlciIsImlkIjoidGVzdC12aWV3ZXIiLCJqdGkiOiJhZmZkMGIxNS0wZWYyLTRjYjctYjQxMy1lY2VmZDRkNjA1ZjkiLCJuYW1lIjoiVGVzdCBWaWV3ZXIiLCJleHAiOjQ2OTc5MzkxNTgsImlhdCI6MTU0NDMzOTE1OH0.cSebSzQXijB6_TS7K_av1B2DV8ItpWvtMcNjZDgJkx8f6zF3BbGC3B_IHegJl0PoHaOriePAlocfCmUe9hvAVXyCuk_3RZjUOtxGbN7qH2MqHylPnxBOEaZPSIoOh_QC8kRm6GlpUJhrQEbRf7kutcjBEmPKBk732blpSwlfA7dvDMPDeOTnwzCQmksIQ7SsR2dr_AxSPzEUN5nEywgdfQzNxlQcZ6fP0f3xUDihF2SaDkp3jX3nJiTixhnMV2ch1mLzP646k1g_ppVpwZOXZ_QxUtWeyhyp5V7DeXsSwOFotTxnTigDo6sWLcFeOITJaECtLnhBV__rKzdg8VcVUw

#### Stranger

Issuer: test-issuer
ID: test-stranger
Name: Test Stranger

Id Token with 100 years life time: 

eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0ZXN0LWlzc3VlciIsImlkIjoidGVzdC1zdHJhbmdlciIsImp0aSI6Ijg5MWViMjg3LTI0YWYtNGM0MC05NTYwLTVmZGNlN2U3ZGQzNCIsIm5hbWUiOiJUZXN0IFN0cmFuZ2VyIiwiZXhwIjo0Njk3OTM5MTk2LCJpYXQiOjE1NDQzMzkxOTZ9.Ry8XZ_rwxZlRdC1AtZAb1BI195kHqt_1mIOcl4dX72z1FdSYr3XkMOvh28MNt6K4mTxY2Qj5g4yxQXjChG03MaP0rC5c66PrJ35IpcSaZjX1u41cQr0HflY-iEPtFanz63uE3hFu1DaqivyUbI88M7oFy5MTzkuKe4uJukoVylsp89rtJR-iyDuBrDskg7GjJTEDOHYub1_5roqpODPaNNlkhwBUswDeucg0kDABbVq1Z7phwdrYnj-4b_TUmvR5rINaQwFlCW2I0iC1-xH6CFahSmtXogObjR5Xe3uEal7Dk92Is_gbaU7k6hIPnqe-qxep5NQQ500q-Ak8MzRxOQ

#### Anonymous

Issuer: test-issuer
ID: anonymous
Name: anonymous

Id Token with 100 years life time: 

eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0ZXN0LWlzc3VlciIsImlkIjoiYW5vbnltb3VzIiwianRpIjoiZDU5Y2Q1NTktNTQ5ZS00MThhLWEzMzMtZWZkYmYxMmY3OWNmIiwibmFtZSI6ImFub255bW91cyIsImV4cCI6NDY5NzkzOTI2OSwiaWF0IjoxNTQ0MzM5MjY5fQ.i179C6fgMMlRtyaoiQZLRlCc7xHU4DGfchzdrKxiB50zD50XzlFiztOUdZIVXTsX2TttHm1jKnw0iF4Vjj6BpGvn8IFggrq5qzjUNO_unFKSHNhLNjXHln7QOIJfJqxfg7feKYswOm0uEEW181fckDsRN0txWvXr9LUGlw1H5bg18G64R1eXXdwCe7lGo7eSNgk3Z5XttrePZl1YJP1wQzneJvFYonjQFEiLAteMgv1k4R4YTnSkMy4ROJYnwvy5WH3NmREWhUdEfIRf6m-5qZ0qW-VfYRKchUU3VHViQ41c8uH1dRwaBjkjzfWxnrf_veI-96oRAfgSS9hpcmNbLQ

## Karma

karma start karma.config.js  --browsers ChromeHeadless

# Publish package

## First publish

---
    npm publish --access public
---

## Update

---
    npm version patch
    npm publish
---

## Deploying storage server to heroku

### Preparation 

* Checkout this project from github.
* Install heroku cli.

### Commands

    git clone https://github.com/tlaukkan/reality-space.git
    cd reality-space
    heroku create --region eu <your-heroku-account>-reality-space

    git push heroku master
    heroku logs -t
    heroku logs -t --dyno=web

To setup storage cluster configuration with AWS S3

    heroku create --region eu rs-test-storage
    heroku config:set CLUSTER_CONFIGURATION_URL=https://cdn.jsdelivr.net/gh/tlaukkan/reality-space@0.0.25/config/public-test-cluster.json 
    heroku config:set STORAGE_URL=https://rs-test-storage.herokuapp.com/api/ 
    heroku config:set STORAGE_TYPE=S3
    heroku config:set AWS_REGION=eu-central-1
    heroku config:set AWS_PUBLIC_BUCKET=dataspace-eu
    heroku config:set AWS_ACCESS_KEY_ID=
    heroku config:set AWS_SECRET_ACCESS_KEY=
     
To setup main processor cluster configuration 

    heroku create --region eu rs-test-processor
    heroku config:set CLUSTER_CONFIGURATION_URL=https://cdn.jsdelivr.net/gh/tlaukkan/reality-space@0.0.25/config/public-test-cluster.json
    heroku config:set PROCESSOR_URL=wss://rs-test-processor.herokuapp.com/

To setup 0-0-0 processor cluster configuration 

    heroku create --region eu rs-test-processor-0-0-0
    heroku config:set CLUSTER_CONFIGURATION_URL=https://cdn.jsdelivr.net/gh/tlaukkan/reality-space@0.0.25/config/public-test-cluster.json
    heroku config:set PROCESSOR_URL=wss://rs-test-processor-0-0-0.herokuapp.com/


### Health check
Storage server provides 200 OK healthcheck at URL path: /health-check.

Example: http://127.0.0.1:8080/health-check

