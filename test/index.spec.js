const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../index');
app.close();
const expect = chai.expect;
chai.use(chaiHttp);

describe('App authentication', () => {
	it('Should respond with http: 200 & static page on / GET', done => {
		chai
			.request(app)
			.get('/')
			.end((err, res) => {
				expect(res).to.have.status(200);
				done();
			});
	});

	it('Should redirect to use SSO if not a Allowed IP', done => {
		chai
			.request(app)
			.get('/')
			.set('X-Forwarded-For', '192.168.1.1')
			.end((err, res) => {
				expect(res).to.redirect;
				done();
			});
	});
});
