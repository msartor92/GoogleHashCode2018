// Make sure we got a filename on the command line.
/*if (process.argv.length < 3) {
  console.log('Usage: node ' + process.argv[1] + ' FILENAME');
  process.exit(1);
}*/
//execute
console.log(`Start time: ${new Date()}`);
main(process.argv);

async function main(argv) {
    //var filename = argv[2];

    singleDataset("a_example");
    singleDataset('b_should_be_easy');
    singleDataset('c_no_hurry');
    singleDataset('d_metropolis');
    singleDataset('e_high_bonus');
}

async function singleDataset(filename) {
    console.log(`Start elaborate file: ${filename}`);
    var parsed = await parser(filename);
    var result = await processing(parsed, filename);
    storer(result, filename);
}

function processing(parsed, filename) {
    return new Promise(resolve => {
        //init rides
        var rides = parsed.rides;
        //init vehicles
        var vehicles = initVehicle(parsed.vehicle);
        
        var k = availableRides(rides);
        while(k > 0) {
            console.log(`${filename} available rides: ${k}`);
            vehicles.forEach(v => {v.busy = false;});
            
            vehicles.forEach(v => {
                rides.sort(function(a,b) {
                    /*var p = v.t + vehicleToPickUpLength(v, a) + routeLength(a);//shortest travel
                    var q = v.t + vehicleToPickUpLength(v, b) + routeLength(b);*/
                    /*var p = vehicleToPickUpLength(v, a);//nearest passenger
                    var q = vehicleToPickUpLength(v, b);*/
                    var p = a.pickup - (v.t + vehicleToPickUpLength(v,a) + 1);//minimize time waste at pickup
                    var q = b.pickup - (v.t + vehicleToPickUpLength(v,b) + 1);
                    /*var p = a.pickup;//sort by pick up
                    var q = b.pickup;*/
                    /*var p = a.dropoff;//sort by dropp off
                    var q = b.dropoff;*/
                    
                    if(p<q)
                        return -1;
                    if(p>q)
                        return 1;
                    else return 0;
                });
                
                rides.forEach(g => {
                    if(v.busy == false) {
                        if(g.dropoff > travelFullLength(v,g) && g.taken == false) {
                            v.busy = true;
                            v.rides.push(g.index);
                            v.t = travelFullLength(v,g);
                            v.posx = g.dwx;
                            v.posy = g.dwy;
                            g.taken = true;
                        }
                    }
                });
            });
            k = shouldStop(rides, k);
        }
        
        resolve(formatSolution(vehicles));
    });
}

function availableRides(rides) {
    var c = 0;
    rides.forEach(g => {
        if(g.taken ==false)
            c++
    });
    return c;
}

function travelFullLength(vehicle, ride) {
    return vehicle.t + vehicleToPickUpLength(vehicle, ride) + routeLength(ride) + (ride.pickup - vehicle.t +vehicleToPickUpLength(vehicle,ride));
}

function routeLength(ride) {
    return Math.abs(ride.upx -ride.dwx) + Math.abs(ride.upy - ride.dwy);
}

function vehicleToPickUpLength(vehicle, ride) {
    return Math.abs(vehicle.posx -ride.upx) + Math.abs(vehicle.posy -ride.upy);
}

function formatSolution(vehicles) {
    var out = new Array(vehicles.length);
    
    vehicles.forEach(v => {
        if(v.rides.length > 0)
            out.push(v.rides);
    });
    
    return out;
}

function shouldStop(rides, k) {
    var updated_k = availableRides(rides);
    var new_k;
    
    if(updated_k < k){
        new_k = updated_k;
    } else {
        // no more rides that i can use
        new_k = 0;
    }
    return new_k;
}

function initVehicle(size) {
    var vehicles = Array(size);
    for(var i = 0; i< size; i++) {
        vehicles[i] = {
            posx: 0,
            posy: 0,
            index: i,
            t: 0,
            busy: false,
            rides: []
        };
    }
    return vehicles;
}

// data parser
function parser(name) {
    return new Promise(resolve => {
        var fs= require('fs');
        var filename = "./in/" + name + ".in";
        // Read the file contents.
        fs.readFile(filename, 'utf8', (err, data) => {
            // console.log(data);
            if(err) throw err;
            
            var parsed = {};
            var rows = data.split('\n');
            var rides = new Array(rows.length - 1);
          
            rows.forEach((row,i) => {
                if(i == 0) {
                    var indexes = row.split(' ');
                    parsed.rows = indexes[0];
                    parsed.columns = indexes[1];
                    parsed.vehicle = indexes[2];
                    parsed.rides = indexes[3];
                    parsed.bonus = indexes[4];
                    parsed.steps = indexes[5];
                } else {
                    var guida = row.split(' ');
                    rides[i-1] = {
                        index : i-1,
                        upx : guida[0],
                        upy : guida[1],
                        dwx : guida[2],
                        dwy : guida[3],
                        pickup : guida[4],
                        dropoff : guida[5],
                        taken: false
                    }
                }
            });
            parsed.rides = rides;
            //console.log(parsed);
            resolve(parsed);
        });
    });
}

// data persistence
function storer(solution, filename) {
    return new Promise(resolve => {
        var fs= require('fs');
        var data = '';
        
        for(var i = 0; i< solution.length; i++) {
            if(solution[i] == null || solution[i].length == 0) {
                riga = '0';
            } else {
                var riga = solution[i].length;
                solution[i].forEach(i => {
                    riga = riga + " " + i;
                });
            }
            data = riga + '\n' + data;
        }
        
        fs.writeFile("./out/" + filename + ".out", data, 'utf8', (err, data) => {
            var ts = new Date();
            console.log(`Wrote file: ${filename}!!!! at: ${ts}`);
            resolve();
        });
    });
}
