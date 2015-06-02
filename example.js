
function cDC(nums){
	degChanges =[];

	for(i in nums){

		var ser = nums;

		var thisP = ser[i];
		var nexNum = parseInt(i) + 1;
		var nextP = ser[nextNum];

		var result = nextP / thisP;

		degChanges[i] = result;

	}

	return degChanges;
}