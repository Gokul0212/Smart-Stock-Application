export const handle = async ({event, resolve}) => {
    console.log('BEFORE:',event.request.method,event.url.pathname);

    const response = await resolve(event);

    console.log('After:',event.request.method,event.url.pathname);

    return response;
};