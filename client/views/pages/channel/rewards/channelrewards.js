const time_to_claim = 1000*60*60*24*7
const max_items_per_call = 50

Template.channelrewards.rendered = function() {
    Session.set('finishedLoadingRewards', false)
    avalon.getVotesByAccount(Session.get('activeUsername'), 0, function(err, res) {
        if (res.length < max_items_per_call)
            Session.set('finishedLoadingRewards', true)
        for (let i = 0; i < res.length; i++) {
            if (!res[i].claimed)
                res[i].timeToClaim = res[i].ts+time_to_claim
            res[i].claimable = Math.floor(res[i].claimable)
        }
        Session.set('myRewards', res)
    })
}

Template.channelrewards.helpers({
    'rewards': function(){
        return Session.get('myRewards')
    },
    isClaimable: function(vote){
        if (new Date().getTime() - vote.ts > time_to_claim)
            return true
        return false
    },
    isClaimed: function(vote){
        if (vote.claimed && vote.claimed > 0)
            return true
        return false
    },
    finishedLoading: function(){
        return Session.get('finishedLoadingRewards')
    }
})

Template.channelrewards.events({
    'click .claim': function (event) {
        var claim = this
        var button = event.target
        if (button.className.indexOf('claim button') == -1)
            button = event.target.parentElement
        
        button.classList.add('disabled')
        broadcast.avalon.claimReward(claim.author, claim.link, function(err, res) {
            if (err) {
                button.classList.remove('disabled')
                toastr.error(Meteor.blockchainError(err))
                return
            }
            toastr.success(translate('CHANNEL_REWARDS_CLAIMED_POPUP', claim.claimable/100), translate('USERS_SUCCESS'))            
            var myRewards = Session.get('myRewards')
            for (let i = 0; i < myRewards.length; i++) {
                if (myRewards[i].author == claim.author && myRewards[i].link == claim.link) {
                    myRewards[i].claimed = new Date().getTime()
                }
            }
            Session.set('myRewards',myRewards)
        })
    },
    'click #loadMoreRewardsBtn': function() {
        $('#loadMoreRewardsBtn').prop('disabled', true);
        var currentRewards = Session.get('myRewards')
        var lastRewardTime = currentRewards[currentRewards.length-1].contentTs
        avalon.getVotesByAccount(Session.get('activeUsername'), lastRewardTime, function(err, res) {
            $('#loadMoreRewardsBtn').prop('disabled', false);
            if (err) return
            if (res.length < max_items_per_call)
                Session.set('finishedLoadingRewards', true)
            for (let i = 0; i < res.length; i++) {
                if (!res[i].claimed)
                    res[i].timeToClaim = res[i].ts+time_to_claim
                res[i].claimable = Math.floor(res[i].claimable)
                currentRewards.push(res[i])
            }
            Session.set('myRewards', currentRewards)
        })
    }
})