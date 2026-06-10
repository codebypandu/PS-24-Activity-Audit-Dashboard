package com.campusflow.registration.repository;

import com.campusflow.registration.model.ActivitySummary;
import com.campusflow.registration.model.ActorType;
import com.campusflow.registration.model.Severity;
import com.campusflow.registration.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivitySummaryRepository extends JpaRepository<ActivitySummary, Long> {
    Optional<ActivitySummary> findByUserAndActionIgnoreCaseAndActorTypeAndSeverityAndSourceIgnoreCase(
        User user, String action, ActorType actorType, Severity severity, String source);

    List<ActivitySummary> findAllByOrderByLastEventAtDesc();
    List<ActivitySummary> findByUserOrderByLastEventAtDesc(User user);
}
