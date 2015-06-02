
function cDC(nums, ticks){
	var numGoods = 0;
	var numBads = 0;
	if(typeof ticks == "undefined"){
		var ticks = 0;
	}
	degChanges =[];

	for(i=0; i <(nums.length-ticks); i++){


		i = parseInt(i)+ ticks;
		var ser = nums;


		var thisP = ser[i];
		var nextNum = parseInt(i) + 1;
		var nextP = ser[nextNum];

		var result = nextP / thisP;

		degChanges[i] = result;

		if(result > 1.0018){
			numBads = numBads+1;
			if(holding==false){
			buy(nums[i], 1);
			}

			console.log(i);
		}
		if(result < 0.997){
			numGoods = numGoods+1;
			//console.log(i);
		}

		if(result < 1.0008 && result > .999){
			if(holding==true){
				sell(nums[i], 1);
			}
		}


		if(i> (nums.length)-10){
			if(holding ==true){
			sell(nums[i], 1);
			}
		}
	
	}

	console.log(numGoods);
	console.log(numBads);
	console.log('ended up with '+ amountHas);
	return degChanges;
}



var holding =false;

function buy(price, amount){

	var it = (price*amount);
	console.log('buying 1 btc at '+ it);
	amountHas = amountHas - it ;
	holding = true;


}


function sell(price, amount){
	var it = (price*amount);
	console.log('selling 1 btc at '+ it);
	amountHas = amountHas +it;
	holding= false;
}


var amountHas= 300;
