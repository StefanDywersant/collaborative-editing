var q = require('q'),
	expect = require('chai').expect,
	sinon = require('sinon'),
	sinonAsPromised = require('sinon-as-promised')(q),
	proxyquire = require('proxyquire');


describe('backend.form.states', () => {
	var states,
		formConnectionsStub,
		replConnectionsStub,
		loggerStub = {
			info: sinon.stub(),
			verbose: sinon.stub(),
			debug: sinon.stub(),
			silly: sinon.stub()
		};


	before(() => {
		formConnectionsStub = {get: sinon.stub()};
		replConnectionsStub = {all: sinon.stub()};

		states = proxyquire('../backend/form/states', {
			'../service/logger': loggerStub,
			'./connections': formConnectionsStub,
			'../replication/connections': replConnectionsStub
		});
	});


	it('should return null on non-existent form get attempt', (done) => {
		var formState = states.get('non-existent-form-(i-hope)');

		expect(formState).to.be.null;

		done();
	});


	it('should return empty array on all call when no update method was yet issued', (done) => {
		var formState = states.all();

		expect(formState).to.be.empty;

		done();
	});


	it('should notify all replicas on first form\'s state update', (done) => {
		var formState = {form: 'form-first', state: 1, ts: 1},
			replConnection = {emit: function() {}},
			clientConnection = {id: 'test-client-connection'},
			replConnectionEx = sinon.mock(replConnection).expects('emit')
				.thrice()
				.withArgs('state', formState);

		replConnectionsStub.all.returns([replConnection, replConnection, replConnection]);

		states.update(formState, clientConnection);

		expect(states.get('form-first')).to.be.eql(formState);
		expect(states.all()).to.be.eql([formState]);

		replConnectionEx.verify();

		done();
	});
});