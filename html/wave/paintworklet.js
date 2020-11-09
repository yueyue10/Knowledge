registerPaint('wave', class {
	static get inputProperties() {
		return ['--animation-tick'];
	}
	paint(ctx, geom, properties) {
		let tick = Number(properties.get('--animation-tick'));
		const {
			width,
			height
		} = geom;
		const initY = height * 0.4;
		tick = tick * 2;

		ctx.beginPath();
		ctx.moveTo(0, initY + Math.sin(tick / 20) * 10);
		for (let i = 1; i <= width; i++) {
			ctx.lineTo(i, initY + Math.sin((i + tick) / 20) * 10);
		}
		ctx.lineTo(width, height);
		ctx.lineTo(0, height);
		ctx.lineTo(0, initY + Math.sin(tick / 20) * 10);
		ctx.closePath();

		ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
		ctx.fill();
	}
})
