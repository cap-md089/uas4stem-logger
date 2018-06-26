const start = Date.now () / 1000;

export default class UASSession {
	public static coords: {
		latitude: number,
		longitude: number,
		time: number,
		description: string
	}[] = [];
	
	public static recordingLats: number[] = [];
	public static recordingLongs: number[] = [];

	public static volts: number[] = [];

	public static recordingCoords: boolean = false;

	public static batteryTimer: number = Math.round(
		Date.now() / 1000
	) - start;
	public static voltageTimer: number = Math.round(
		Date.now() / 1000
	) - start;

	public static batteryId: number = 1;
	
	public static fileLocation: string = process.cwd() + '\\UASFlightInfo.json';

	public static sessionID: string = new Date().toISOString().slice(0, 16);

	public static readonly FRONT_CAMERA_ANGLE: number = 26.064664078303848196356278789571;
	public static readonly SIDE_CAMERA_ANGLE: number = 46.367543999867315345946421705557;

	public static flying: boolean = false;

	public static flightCount: number = 0;

	public static queue: number[][] = [];

	public static connection: {
		packets: number,
		start: number
	} = {
		packets: 0,
		start: 0
	};

	public static maxFlightTime: number = 480;

	public static getCameraValues (altitude: number): {
		width: number;
		depth: number;
	} {
		return {
			width: 2 * 1.04891304331  * altitude,
			depth: 2 * 0.489130434783 * altitude
		};
	}

	public static reset (): void {
		this.coords = [];
		this.recordingLats = [];
		this.recordingLongs = [];
		this.volts = [];
		this.recordingCoords = false;
		this.batteryTimer = Math.round(Date.now() / 1000) - start;
		this.batteryId = 1;
		this.sessionID = new Date().toISOString().slice(0, 16);
		this.flying = false;
	}
}