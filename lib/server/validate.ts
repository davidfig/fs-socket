export function validate(directory: string): boolean {
    if (directory.includes('..')) {
        console.warn('user attempted to access a directory beyond their parent directory')
        return false
    }
    return true
}