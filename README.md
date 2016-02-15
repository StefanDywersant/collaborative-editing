# CKSource assignment


## Assignment description

Create a service/feature that allows synchronisation of checkbox statuses in a browser (“collaborative editing” of checkboxes).

**Key features**
* The service should support multiple HTML forms on multiple websites to handle states of multiple different groups of checkboxes.
* The service should correctly handle a situation when user closes a browser and connects again.
* The service should reasonably handle lost internet connection and reconnecting.
* Usage of external libraries is allowed, but pay reasonable attention to performance.

### Sample use cases:

A page provides an HTML form:

```html
 <label><input type="checkbox" name="first" value="1">1</label>
 <label><input type="checkbox" name="first" value=”2”>2</label>
 <label><input type="checkbox" name="first" value="3">3</label>

 <label><input type="checkbox" name="second" value="a">a</label>
 <label><input type="checkbox" name="second" value=”b”>b</label>
```


### Case 1: Server should keep the state of the checkboxes:
* User A loads page.
* User A checks answer “1”.
* User B loads page. Expected result: answer “1” should be checked.
* User A closes page.
* User B unchecks answer “1” and checks answer “2”.
* User C loads page. Expected result: answer “2” should be checked.


### Case 2: Server should handle lost connection and possible conflicts caused by it:
* User A loads page with all input elements unchecked.
* User A checks answer “1” and “a”.
* User A lost the connection.
* User A checks answer “2” and “b”.
* User B loads page (with answers checked: “1” and “a”).
* User B checks answer “3”.
* User A recovers connection.
* Expected result: “1”,”3”, ”a” and ”b” should be check for both users. Changes made by user “A” to the first list in step “4” (checking value “2”) should be rejected once user A recovered the connection, because it was made on a list which is outdated (by the fact that user “B” already made changes on it in the meantime). Changes made by user “A” to the second list in step “4” (checking value “b”) should be applied, because the state of the second list did not change while the internet connection of user A was not working.


Browser support: Chrome & Firefox


### Bonus tasks (not obligatory):
* The application should be relatively efficient and scale well (feel free to use Amazon services or any other cloud solutions) or explain what eventually could be done to make the application scalable.
Secure the communication between the client and server.


### Things that we’d love to see in a provided solution:
* Well-thought architecture (e.g. to eventually easily support later radio inputs or ```<select multiple>```).
* Clean code.
* Tests (a few, to show that you know how to write correct tests).


## Solution description


### Features
* scalable backend capable of running on multiple servers / datacenters
* no single point of failure
* supports multiple backend topologies: links, stars, multiple stars
* utilizes WebSocket connections which leads to small communication footprint
* simple communication protocol (only two types of messages)
* frontend will synchronize with backend after connection loss
* backend<->backend links will synchronize after split


### Drawbacks
* all backends hold exact copy of all forms state - this might be improved by managing only needed state
* websocket stability on poor links could be improved


### Installation

```bash
npm install
```

... should do the job.


### Configuration

Each backend has its own configuration file which inherits options from *default.yaml*. Shipped configuration describes following architecture:

* *backend00.yaml* - backend00 listening on *:8080
* *backend01.yaml* - backend01 listening on *:8081 and connected to backend00
* *backend02.yaml* - backend02 listening on *:8082 and connected to backend01

**Note:** you can play with *logger.level* option in order to increase/decrese logging level.


### Execution

In order to start all example backends you need to issue:

```bash
NODE_ENV=backend00 node app.js
NODE_ENV=backend01 node app.js
NODE_ENV=backend01 node app.js
```

Now you can navigate to: http://localhost:8080, http://localhost:8081 and http://localhost:8082.


### Tests

You can run tests by invoking:

```bash
npm test
```