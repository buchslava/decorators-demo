import { verbose, asyncBehavior } from './verbosity';

@verbose
class FakeDdfCsvReader {
  constructor(private isRejectionNeeded = false) {
  }

  @verbose
  @asyncBehavior
  loadDataPackage(par) {
    return new Promise((resolve, reject) => {
      if (this.isRejectionNeeded) {
        reject(`wrong query ${JSON.stringify(par, null, 2)}`);
      } else {
        const additionalData = this.sum(2, 2);

        par.additionalData = additionalData;

        resolve(`my result ${JSON.stringify(par, null, 2)}`);
      }
    });
  }

  @verbose
  @asyncBehavior
  async query(@verbose par, isRejectionNeeded = false, options = {}) {
    this.isRejectionNeeded = isRejectionNeeded;
    const res = await this.loadDataPackage(par);

    return res;
  }

  @verbose
  sum(a, b) {
    return a + b;
  }

  getVerbosityData() {
    return this['verbosityData'];
  }
}

const reader = new FakeDdfCsvReader();

(async () => {
  try {
    let result = await reader.query({ select: 'concepts' })
    console.log('result is: ', result);

    result = await reader.query({ select: 'concepts' }, false, { verbose: true })
    console.log('result is: ', result);

    result = await reader.query({ select: 'fake-concepts' }, true);

    console.log('result is: ', result);
  } catch (err) {
    console.log('error: ', err);
  } finally {
    console.log('verbosity data: ', JSON.stringify(reader.getVerbosityData(), null, 2));
  }
})();
