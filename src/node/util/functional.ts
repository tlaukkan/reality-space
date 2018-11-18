export function lift<T>(o: T) {
    return new Promise<T>((resolve) => {
        resolve(o)
    });
}