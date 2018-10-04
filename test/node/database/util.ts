export const
    waitOnCondition = (condition: (() => boolean)): Promise<void> =>  {
    return new Promise((resolve, reject) => {
        const timer = setInterval(() => {
            if (condition()) {
                clearInterval(timer);
                resolve();
            }
        }, 100);
    });
};