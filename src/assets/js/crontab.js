var CrontabService = function(alertService) {
	var self = this;
	var crontab = $('.table-crontab tbody');
	var jobToDelete;
	var addJobDialog = new AddJobDialog($('#job-add'), self, alertService);
	var editJobDialog;
	var lastEditedJobHash;
	
	this.runJob = function(job) {
		var hash = job.attr('data-hash');
		var runButton = $('.job-run', job);
		runButton.button('loading');
		
		$.ajax('/job/run/' + hash).done(function(data) {
			alertService.pushSuccess(data.msg);
		}).fail(function(data) {
			alertService.pushError(data.responseJSON.msg);
		}).always(function() {
			runButton.button('reset');
		});

		return this;
	};
	
	this.editJob = function(job) {
		var hash = job.attr('data-hash');
		
		// Use existing dialog if editing the same job
		if (hash == lastEditedJobHash) {
			editJobDialog.open();
		
		// Fetch dialog for given job
		} else {
			// Remove previous dialog
			$('#job-edit').remove();

			$.ajax('/job/edit-form/' + hash).done(function(data) {
				// Append dialog data
				$('body').append(data.html);

				// Init and open dialog
				editJobDialog = new AddJobDialog($('#job-edit'), self, alertService);
				editJobDialog.open();
				lastEditedJobHash = hash;
			}).fail(function() {
				alertService.pushError('Unable to edit the job at this time');
			});
		}
		
		return this;
	};
	
	// Appends newly added job to the cron table
	this.appendJob = function(content, hash) {
		crontab.append(content);
		$(document).trigger('jobAdd', {hash: hash});
		
		return this;
	};
	
	// Refreshes edit job in the cron table
	this.updateJob = function(oldHash, newContent, newHash) {
		$('[data-hash="' + oldHash + '"]', crontab).replaceWith(newContent);
		$(document).trigger('jobEdit', {hash: newHash});
		
		return this;
	};
	
	this.pauseJob = function(job) {
		var hash = job.attr('data-hash');
		
		$.ajax('/job/pause/' + hash).done(function(data) {
			alertService.pushSuccess(data.msg);
			
			var pauseMenuItem  = $('.menu-item-pause', job);
			var resumeMenuItem = $('.menu-item-resume', job);
		
			// Update with the new hash
			job.attr('data-hash', data.hash);
			
			// Refresh interface elements
			job.addClass('inactive');
			pauseMenuItem.addClass('hidden').removeClass('show');
			resumeMenuItem.addClass('show').removeClass('hidden');
		}).fail(function(data) {
			alertService.pushError(data.responseJSON.msg);
		});
		
		return this;
	};
	
	this.resumeJob = function(job) {
		var hash = job.attr('data-hash');
		
		$.ajax('/job/resume/' + hash).done(function(data) {
			alertService.pushSuccess(data.msg);
			
			var pauseMenuItem  = $('.menu-item-pause', job);
			var resumeMenuItem = $('.menu-item-resume', job);
		
			// Update with the new hash
			job.attr('data-hash', data.hash);
			
			// Refresh interface elements
			job.removeClass('inactive');
			resumeMenuItem.addClass('hidden').removeClass('show');
			pauseMenuItem.addClass('show').removeClass('hidden');
		}).fail(function(data) {
			alertService.pushError(data.responseJSON.msg);
		});
		
		return this;
	};
	
	this.deleteJob = function(job) {
		var hash = job.attr('data-hash');
		
		$.ajax('/job/delete/' + hash).done(function(data) {
			alertService.pushSuccess(data.msg);
			
			// Remove element from the DOM
			job.remove();
		}).fail(function(data) {
			alertService.pushError(data.responseJSON.msg);
		});
		
		return this;
	};
	
	// Assign handlers
	$('body').on('click', '.job-add', function() {
		// Prevent button from retaining focus once clicked
		$(this).blur();
		addJobDialog.open();
	});
	
	$('body').on('click', '.job-run', function() {
		var job = $(this).closest('tr');
		self.runJob(job);
		
		// Prevent button from retaining focus once clicked
		$(this).blur();
	});
	
	$('body').on('click', '.job-edit', function(e) {
		e.preventDefault();
		var job = $(this).closest('tr');
		self.editJob(job);
	});

	$('body').on('click', '.job-pause', function(e) {
		e.preventDefault();
		var job = $(this).closest('tr');
		self.pauseJob(job);
	});

	$('body').on('click', '.job-resume', function(e) {
		e.preventDefault();
		var job = $(this).closest('tr');
		self.resumeJob(job);
	});
	
	$('body').on('click', '.job-confirm-delete', function(e) {
		e.preventDefault();
		jobToDelete = $(this).closest('tr');
		$('#job-delete-confirmation').modal();
	});
	
	$('body').on('click', '.job-delete', function() {
		$('#job-delete-confirmation').modal('hide');
		self.deleteJob(jobToDelete);
	});
	
	// Enable tooltips now and in the future
	$(function() {
		$(".table-crontab [data-toggle='tooltip']").tooltip();
	});
	$(document).on('jobAdd jobEdit', function(event, data) {
		var job = $(".table-crontab [data-hash='" + data.hash + "']");
		$("[data-toggle='tooltip']", job).tooltip();
	});
};