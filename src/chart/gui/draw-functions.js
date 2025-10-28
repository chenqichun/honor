export function drawBackground(renderer, target, isHovered, hitTestData) {
    if (renderer.drawBackground) {
        renderer.drawBackground(target, isHovered, hitTestData);
    }
}
export function drawForeground(renderer, target, isHovered, hitTestData) {
    renderer.draw(target, isHovered, hitTestData);
}
export function drawSourceViews(paneViewsGetter, drawRendererFn, source, pane) {
    const views = paneViewsGetter(source, pane);
    for (const view of views) {
        const renderer = view.renderer(pane);
        if (renderer !== null) {
            drawRendererFn(renderer);
        }
    }
}
