const sinon = require('sinon');
const chai = require('chai');
const chaiHttp = require('chai-http');
const proxyquire = require('proxyquire');
const expect = chai.expect;
chai.use(chaiHttp);

const sandbox = sinon.sandbox.create();

const capiSpy = {
	getByUuid: sandbox.spy(),
	searchByTerm: sandbox.spy()
};

const app = proxyquire('../../index', {
	'./routes/articles': proxyquire('../../routes/articles', {
		'../modules/Article': capiSpy
	})
});

describe('Article routes', () => {
	afterEach(() => {
		sandbox.reset();
	});

	describe('search', () => {
		it('Should respond with http: 200', done => {
			chai
				.request(app)
				.get('/articles/search/test')
				.end((err, res) => {
					expect(res).to.have.status(200);
					done();
				});
		});

		it('calls the searchByTerm function', done => {
			chai
				.request(app)
				.get('/articles/search/test')
				.end((err, res) => {
					expect(capiSpy.searchByTerm.calledOnce).to.be.true;
					done();
				});
		});

		context('on error', () => {
			it('it renders the error page', done => {
				capiSpy.searchByTerm = () => {
					throw 'test';
				};

				chai
					.request(app)
					.get('/articles/search/test')
					.end((err, res) => {
						expect(res).to.have.status(500);
						expect(res.text).to.equal('Something broke!');
						capiSpy.searchByTerm = sandbox.spy();
						done();
					});
			});
		});

		describe('get', () => {
			it('should respond with http: 200', done => {
				chai
					.request(app)
					.get('/articles/get/123')
					.end((err, res) => {
						expect(res).to.have.status(200);
						done();
					});
			});

			it('calls the getByUuid function', done => {
				chai
					.request(app)
					.get('/articles/get/123')
					.end((err, res) => {
						expect(capiSpy.getByUuid.calledOnce).to.be.true;
						done();
					});
			});

			context('on error', () => {
				it('it renders the error page', done => {
					capiSpy.getByUuid = () => {
						throw 'test';
					};

					chai
						.request(app)
						.get('/articles/get/123')
						.end((err, res) => {
							expect(res).to.have.status(500);
							expect(res.text).to.equal('Something broke!');
							capiSpy.getByUuid = sandbox.spy();
							done();
						});
				});
			});
		});
	});
});
