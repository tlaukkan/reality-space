# A-Frame Dataspace

This library implements client server library for a-frame networking.

## Usage

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

---
    git clone https://github.com/tlaukkan/aframe-dataspace.git
    cd aframe-dataspace
    heroku create <your-heroku-account>-aframe-dataspace

    git push heroku master
    heroku logs -t
    heroku logs -t --dyno=web
---

To setup standalone configuration 
---
    # Center coordinate of the managed data space.
    heroku config:set GRID_CX=0
    heroku config:set GRID_CY=0
    heroku config:set GRID_CZ=0
    # Width, height and depth of the managed data space.
    heroku config:set GRID_EDGE=1000
    # Grid step for optimizing visibility searches.
    heroku config:set GRID_STEP=100
    # Visibility range.
    heroku config:set GRID_RANGE=200 
---
 
To setup cluster configuration 
---
    heroku info -s
    heroku config:set WS_URL=<the websocket URL for the server (wss://xxx.herokuapp.com)
    heroku config:set CLUSTER_CONFIGURATION_URL=<cluster-configuration-url (for example: https://rawgit.com/tlaukkan/aframe-dataspace/master/defaul-configuration.json)

    heroku config:set CLUSTER_CONFIGURATION_URL=https://cdn.rawgit.com/tlaukkan/aframe-dataspace/ed1002ed/defaul-configuration.json
---


### Health check
Storage server provides 200 OK healthcheck at URL path: /health-check.

Example: http://127.0.0.1:8080/health-check

