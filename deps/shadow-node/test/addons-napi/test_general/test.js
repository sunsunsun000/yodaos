'use strict';
// Flags: --expose-gc

var common = require('../../common');
var test_general = require(`./build/Release/test_general.node`);
var assert = require('assert');

var val1 = '1';
var val2 = 1;
var val3 = 1;

class BaseClass {
}

class ExtendedClass extends BaseClass {
}

var baseObject = new BaseClass();
var extendedObject = new ExtendedClass();

// test napi_strict_equals
assert.ok(test_general.testStrictEquals(val1, val1));
assert.strictEqual(test_general.testStrictEquals(val1, val2), false);
assert.ok(test_general.testStrictEquals(val2, val3));

// test napi_get_prototype
assert.strictEqual(test_general.testGetPrototype(baseObject),
                   Object.getPrototypeOf(baseObject));
assert.strictEqual(test_general.testGetPrototype(extendedObject),
                   Object.getPrototypeOf(extendedObject));
// Prototypes for base and extended should be different.
assert.notStrictEqual(test_general.testGetPrototype(baseObject),
                      test_general.testGetPrototype(extendedObject));

// test version management functions
// expected version is currently 3
assert.strictEqual(test_general.testGetVersion(), 3);

var [ major, minor, patch, release ] = test_general.testGetNodeVersion();
assert.strictEqual(process.version.split('-')[0],
                   `v${major}.${minor}.${patch}`);
assert.strictEqual(release, process.release.name);

[
  123,
  'test string',
  function() {},
  new Object(),
  true,
  undefined,
  Symbol()
].forEach((val) => {
  assert.strictEqual(test_general.testNapiTypeof(val), typeof val);
});

// since typeof in js return object need to validate specific case
// for null
assert.strictEqual(test_general.testNapiTypeof(null), 'null');

// Ensure that garbage collecting an object with a wrapped native item results
// in the finalize callback being called.
var w = {};
test_general.wrap(w);
w = null;
global.gc();
var derefItemWasCalled = test_general.derefItemWasCalled();
assert.strictEqual(derefItemWasCalled, true,
                   'deref_item() was called upon garbage collecting a ' +
                   'wrapped object. test_general.derefItemWasCalled() ' +
                   `returned ${derefItemWasCalled}`);


// Assert that wrapping twice fails.
var x = {};
test_general.wrap(x);
common.expectsError(() => test_general.wrap(x),
                    { type: Error, message: 'Invalid argument' });

// Ensure that wrapping, removing the wrap, and then wrapping again works.
var y = {};
test_general.wrap(y);
test_general.removeWrap(y);
// Wrapping twice succeeds if a remove_wrap() separates the instances
test_general.wrap(y);

// Ensure that removing a wrap and garbage collecting does not fire the
// finalize callback.
var z = {};
test_general.testFinalizeWrap(z);
test_general.removeWrap(z);
z = null;
global.gc();
var finalizeWasCalled = test_general.finalizeWasCalled();
assert.strictEqual(finalizeWasCalled, false,
                   'finalize callback was not called upon garbage collection.' +
                   ' test_general.finalizeWasCalled() ' +
                   `returned ${finalizeWasCalled}`);

// test napi_adjust_external_memory
var adjustedValue = test_general.testAdjustExternalMemory();
assert.strictEqual(typeof adjustedValue, 'number');
assert(adjustedValue > 0);
