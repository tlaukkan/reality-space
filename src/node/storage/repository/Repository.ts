
interface Repository {
    save(fileName: string, fileContent: string): Promise<void>;

    load(fileName: string): Promise<string>;
}