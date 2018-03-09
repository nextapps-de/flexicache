if(typeof module !== 'undefined'){

    var env = process.argv[3] === 'test' ? '.min' : '';
    var expect = require('chai').expect;
    var FlexiCache = require("../flexicache" + env + ".js");
}

describe("FlexiCache Test", function(){

    it("Cache implements methods", function(){

        var cache = FlexiCache.new();

        expect(cache).to.be.an.instanceOf(FlexiCache);
        expect(cache).to.respondTo('set');
        expect(cache).to.respondTo('get');
        expect(cache).to.respondTo('del');
        expect(cache).to.respondTo('delete');
        expect(cache).to.respondTo('rm');
        expect(cache).to.respondTo('remove');
    });

    it("Set/Get Cache", function(done){

        var cache = FlexiCache.register();
        var tmp;

        cache.set('foo', 'bar');
        expect(cache.get('foo')).to.equal('bar');

        cache.set('foo', 'foobar');
        expect(cache.get('foo')).to.equal('foobar');

        cache.set('foo', null);
        expect(cache.get('foo')).to.equal(null);

        cache.set('foo', void 0);
        expect(cache.get('foo')).to.equal(void 0);

        cache.set('foo', false);
        expect(cache.get('foo')).to.equal(false);

        cache.set('foo', 0);
        expect(cache.get('foo')).to.equal(0);

        cache.set('foo', '');
        expect(cache.get('foo')).to.equal('');

        cache.set('foo', tmp = {});
        expect(cache.get('foo')).to.equal(tmp);

        cache.set('foo', tmp = function(){});
        expect(cache.get('foo')).to.equal(tmp);

        setTimeout(function(){

            expect(cache.get('foo')).to.equal(tmp);
            done();

        }, 25);
    });

    it("Set/Get Cache (Expire)", function(done){

        var cache = FlexiCache.new(25);

        cache.set('foo', 'bar');
        expect(cache.get('foo')).to.equal('bar');

        setTimeout(function(){

            expect(cache.get('foo')).to.equal('bar');

            setTimeout(function(){

                expect(cache.get('foo')).to.equal('bar');

                setTimeout(function(){

                    expect(cache.get('foo')).to.undefined;
                    done();

                }, 25);
            });
        });
    });

    it("Set/Get Cache (Renew Expiration)", function(done){

        var cache = FlexiCache.new(25);

        cache.set('foo', 'bar');
        expect(cache.get('foo')).to.equal('bar');

        setTimeout(function(){

            expect(cache.get('foo')).to.equal('bar');
            cache.set('foo', 'bar');

            setTimeout(function(){

                expect(cache.get('foo')).to.equal('bar');
                cache.set('foo', 'bar');

                setTimeout(function(){

                    expect(cache.get('foo')).to.equal('bar');

                    setTimeout(function(){

                        expect(cache.get('foo')).to.undefined;
                        done();

                    }, 15);
                }, 15);
            }, 15);
        });
    });

    it("Set/Get Cache (Revalidate Expiration)", function(done){

        var cache = FlexiCache.new(25);

        cache.set('foo', 'bar');
        expect(cache.get('foo')).to.equal('bar');

        setTimeout(function(){

            expect(cache.get('foo')).to.equal('bar');
            cache.set('foo', 'bar', 25);

            setTimeout(function(){

                expect(cache.get('foo')).to.equal('bar');

                setTimeout(function(){

                    expect(cache.get('foo')).to.undefined;
                    done();

                }, 15);
            }, 15);
        }, 15);
    });

    it("Set/Get Cache (Limit)", function(done){

        var cache = FlexiCache.new(false, 2);

        // 1:
        cache.set('foo', 'foo');
        expect(cache.get('foo')).to.equal('foo');

        // 2:
        cache.set('bar', 'bar');
        expect(cache.get('bar')).to.equal('bar');

        // 3:
        cache.set('foobar', 'foobar');
        expect(cache.get('foobar')).to.equal('foobar');
        expect(cache.get('bar')).to.equal('bar');
        expect(cache.get('foo')).to.undefined;

        setTimeout(function(){

            expect(cache.get('foobar')).to.equal('foobar');
            expect(cache.get('bar')).to.equal('bar');
            done();

        }, 25);
    });

    it("Set/Get Cache (Auto Cleanup)", function(done){

        var cache = FlexiCache.new(false, false, true);

        cache.set('foo', 'foo');
        cache.set('bar', 'bar');
        expect(cache.get('foo')).to.equal('foo');

        cache.cleanup(true);

        expect(cache.get('foo')).to.equal('foo');
        expect(cache.get('bar')).to.undefined;

        cache.cleanup(false);
        cache.cleanup(false);

        expect(cache.get('foo')).to.equal('foo');

        cache.cleanup(true);
        cache.cleanup(true);

        expect(cache.get('foo')).to.undefined;

        cache.set('foo', 'foo');

        setTimeout(function(){

            expect(cache.get('foo')).to.equal('foo');
            done();

        }, 25);
    });

    it("Remove Cache", function(){

        var cache = FlexiCache.new();

        cache.set('foo', 'foo');
        expect(cache.get('foo')).to.equal('foo');
        expect(cache.remove('foo')).to.equal('foo');
        expect(cache.get('foo')).to.undefined;
    });

    it("Delete Cache", function(){

        var cache = FlexiCache.new();

        cache.set('foo', 'foo');
        expect(cache.get('foo')).to.equal('foo');
        cache.del('foo');
        expect(cache.get('foo')).to.undefined;
    });

    it("Get Cache Size", function(){

        var cache = FlexiCache.new();

        cache.set('foo', 'foo');
        cache.set('bar', 'bar');
        cache.set('foobar', 'foobar');

        expect(cache.count()).to.equal(3);
        expect(cache.length).to.equal(3);
        expect(cache.size).to.equal(1000);
    });

    it("Clear Cache", function(){

        var cache = FlexiCache.new();

        cache.set('foo', 'foo');
        cache.set('bar', 'bar');
        cache.set('foobar', 'foobar');

        expect(cache.count()).to.equal(3);

        cache.reset();

        expect(cache.count()).to.equal(0);
    });

    it("Clone Cache", function(){

        var cache = FlexiCache.new();
        var obj = {foo: 'foo'};
        var tmp;

        cache.set('foo', obj);
        expect(cache.get('foo')).to.equal(obj);

        obj.foo = 'bar';
        expect(cache.get('foo')).to.equal(obj);

        cache.get('foo').foo = 'bar';
        obj = {foo: 'bar'};
        expect(cache.get('foo')).to.deep.equal(obj);

        cache.clone('foo').foo = 'foobar';
        tmp = {foo: 'foobar'};
        expect(cache.get('foo')).not.to.deep.equal(tmp);
        expect(cache.get('foo')).to.deep.equal(obj);
    });
});
