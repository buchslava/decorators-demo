type Constructor<T> = { new(...args: any[]): T };

const verboseParams = new Set<string>();
const asyncBehaviorMethods = new Set<string>();

interface IVerbosity {
  verbosityData;
}

function verboseClass<T>(clazz: Constructor<T>): Constructor<T & IVerbosity> {
  clazz.prototype.verbosityData = [];

  return clazz as Constructor<T & IVerbosity>;
}

const getMethodKey = (propertyKey, constructorName) => `${propertyKey}@${constructorName}`;
const getParamKey = (parameterIndex, propertyKey, constructorName) => `${parameterIndex}@${getMethodKey(propertyKey, constructorName)}`;

function verboseMethod(target, method: string, descriptor) {
  const originalMethod = descriptor.value;
  const now = () => new Date().toISOString();
  const getData = (args) => {
    const argsKeys = Object.keys(args);
    const data = [];

    for (const argKey of argsKeys) {
      if (verboseParams.has(getParamKey(argKey, method, target.constructor.name))) {
        data.push({
          paramNo: argKey,
          value: args[argKey]
        });
      }
    }

    return data;
  };
  const hasVerboseMode = args => !!args && args.length > 1 && typeof args[2] === 'object' && args[2].verbose === true;

  if (asyncBehaviorMethods.has(getMethodKey(method, target.constructor.name))) {
    descriptor.value = function (...args: any[]) {
      return new Promise((resolve, reject) => {
        const data = getData(args);

        if (!hasVerboseMode(args)) {
          this.verbosityData.push({ method, status: 'started', data, time: now() });
        }

        originalMethod.apply(this, args).then(result => {
          if (!hasVerboseMode(args)) {
            this.verbosityData.push({ method, status: 'ok', feature: 'async', time: now() });
          }

          resolve(result);
        }).catch(error => {
          this.verbosityData.push({ method, status: 'failed', error, time: now() });

          reject(error);
        });
      });
    }
  } else {
    descriptor.value = function (...args: any[]) {
      const data = getData(args);
      if (!hasVerboseMode(args)) {
        this.verbosityData.push({ method, status: 'started', data, time: now() });
      }

      const result = originalMethod.apply(this, args);

      if (!hasVerboseMode(args)) {
        this.verbosityData.push({ method, status: 'ok', time: now() });
      }

      return result;
    }
  }

  return descriptor;
}

function verboseParameter(target, propertyKey: string, parameterIndex: number) {
  verboseParams.add(getParamKey(parameterIndex, propertyKey, target.constructor.name));
}

export function asyncBehavior(target, method: string) {
  asyncBehaviorMethods.add(getMethodKey(method, target.constructor.name));
}

export function verbose(...args: any[]) {
  switch (args.length) {
    case 1:
      return verboseClass.apply(this, args);
    case 2:
      return verboseMethod.apply(this, args);
    case 3:
      if (typeof args[2] === 'number') {
        return verboseParameter.apply(this, args);
      }

      return verboseMethod.apply(this, args);
    default:
      throw new Error('Decorators are not valid here!');
  }
}
